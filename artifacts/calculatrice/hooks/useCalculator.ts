import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const OPERATORS = ['+', '-', '×', '÷'];
const SIMPLE_NUMBER = /^-?\d*(,\d*)?$/;

export function useCalculator() {
  const [expression, setExpression] = useState<string>('');
  const [resultPreview, setResultPreview] = useState<string>('');
  const [isEvaluated, setIsEvaluated] = useState<boolean>(false);
  const hiddenDigits = useRef<string>('');
  const lastShakeAt = useRef<number>(0);

  useEffect(() => {
    if (!expression || isEvaluated) {
      setResultPreview('');
      return;
    }

    const result = evaluateMath(expression);
    setResultPreview(
      result !== null && result.toString().replace('.', ',') !== expression
        ? formatExpression(result.toString().replace('.', ','))
        : '',
    );
  }, [expression, isEvaluated]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;
    try {
      Accelerometer.setUpdateInterval(350);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const force = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        if (force > 2.35 && now - lastShakeAt.current > 800) {
          lastShakeAt.current = now;
          if (expression === '' && hiddenDigits.current !== '') {
            setExpression(hiddenDigits.current);
            hiddenDigits.current = '';
            setIsEvaluated(false);
          }
        }
      });
    } catch {
      // The calculator remains fully usable if a device has no accelerometer.
    }

    return () => subscription?.remove();
  }, [expression]);

  const handlePress = (button: string) => {
    if (button === 'AC') {
      hiddenDigits.current = '';
      setExpression('');
      setResultPreview('');
      setIsEvaluated(false);
      return;
    }
    if (button === '⌫') {
      setExpression((value) => value.slice(0, -1));
      setIsEvaluated(false);
      return;
    }
    if (button === '=') {
      const result = evaluateMath(expression);
      if (result === null) {
        setResultPreview(expression ? 'Erreur' : '');
        return;
      }
      setExpression(result.toString().replace('.', ','));
      setResultPreview('');
      setIsEvaluated(true);
      return;
    }
    if (button === '( )') {
      const opens = (expression.match(/\(/g) ?? []).length;
      const closes = (expression.match(/\)/g) ?? []).length;
      const last = expression.slice(-1);
      if (opens > closes && last !== '(' && !OPERATORS.includes(last)) {
        setExpression((value) => value + ')');
      } else if (expression && ![...OPERATORS, '('].includes(last)) {
        setExpression((value) => value + '×(');
      } else {
        setExpression((value) => (isEvaluated ? '(' : value + '('));
      }
      setIsEvaluated(false);
      return;
    }

    if (isEvaluated) {
      if ([...OPERATORS, '%'].includes(button)) {
        setExpression((value) => value + button);
      } else {
        setExpression(button === ',' ? '0,' : button);
      }
      setIsEvaluated(false);
      return;
    }

    setExpression((value) => {
      if (button === ',') {
        const segment = value.split(/[+×÷()]/).pop() ?? '';
        if (segment.includes(',')) return value;
        return segment === '' || segment === '-' ? `${value}0,` : `${value},`;
      }
      if (OPERATORS.includes(button)) {
        const last = value.slice(-1);
        if (OPERATORS.includes(last)) return value.slice(0, -1) + button;
        if (!value && button !== '-') return value;
        return value + button;
      }
      if (/^\d$/.test(button)) {
        const segment = value.split(/[+×÷()]/).pop() ?? '';
        if (segment === '0' || segment === '-0') return value.slice(0, -1) + button;
      }
      return value + button;
    });
  };

  const swipeDelete = () => {
    if (isEvaluated || !expression || !SIMPLE_NUMBER.test(expression)) return;
    if (!hiddenDigits.current) hiddenDigits.current = expression;
    setExpression(expression.slice(0, -1));
  };

  return { expression, resultPreview, handlePress, swipeDelete };
}

export function formatExpression(expression: string) {
  if (!expression) return '';
  return expression.replace(/-?\d+(?:,\d*)?/g, (number) => {
    const negative = number.startsWith('-') ? '-' : '';
    const [integer, decimals] = number.slice(negative ? 1 : 0).split(',');
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${negative}${grouped}${decimals === undefined ? '' : `,${decimals}`}`;
  });
}

function evaluateMath(expression: string): number | null {
  let sanitized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/%/g, '/100')
    .replace(/[+*/]$/, '');
  if (!sanitized || sanitized === '-') return null;

  const open = (sanitized.match(/\(/g) ?? []).length;
  const close = (sanitized.match(/\)/g) ?? []).length;
  sanitized += ')'.repeat(Math.max(0, open - close));

  if (!/^[\d.+\-*/() ]+$/.test(sanitized)) return null;
  try {
    const result: unknown = new Function(`return (${sanitized})`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return Math.round(result * 1_000_000_000) / 1_000_000_000;
  } catch {
    return null;
  }
}