import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { appendCalculatorInput, evaluateMath } from '../lib/calculatorMath';
const SIMPLE_NUMBER = /^-?\d*(,\d*)?$/;
const SHAKE_RESTORE_DELAY_MS = 1000;

export function useCalculator() {
  const [expression, setExpression] = useState<string>('');
  const [resultPreview, setResultPreview] = useState<string>('');
  const [isEvaluated, setIsEvaluated] = useState<boolean>(true);
  const [magicEnabled, setMagicEnabled] = useState<boolean>(false);
  const hiddenDigits = useRef<string>('');
  const lastShakeAt = useRef<number>(0);
  const emptySince = useRef<number | null>(null);
  const expressionRef = useRef<string>('');
  const magicEnabledRef = useRef<boolean>(false);
  const previousAcceleration = useRef<{ x: number; y: number; z: number } | null>(null);

  expressionRef.current = expression;
  magicEnabledRef.current = magicEnabled;

  useEffect(() => {
    if (!expression || isEvaluated) {
      setResultPreview('');
      return;
    }

    const result = evaluateMath(expression, true);
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
      Accelerometer.setUpdateInterval(60);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const force = Math.sqrt(x * x + y * y + z * z);
        const previous = previousAcceleration.current;
        previousAcceleration.current = { x, y, z };
        if (!previous) return;

        const accelerationDelta = Math.sqrt(
          (x - previous.x) ** 2 +
          (y - previous.y) ** 2 +
          (z - previous.z) ** 2,
        );
        const now = Date.now();
        const isShake = accelerationDelta > 0.42 || force > 1.75;
        const canRestoreAfterDelay =
          emptySince.current !== null &&
          now - emptySince.current >= SHAKE_RESTORE_DELAY_MS;
        if (
          magicEnabledRef.current &&
          isShake &&
          canRestoreAfterDelay &&
          now - lastShakeAt.current > 600
        ) {
          lastShakeAt.current = now;
          if (expressionRef.current === '' && hiddenDigits.current !== '') {
            setExpression(hiddenDigits.current);
            hiddenDigits.current = '';
            emptySince.current = null;
            setMagicEnabled(false);
            setIsEvaluated(false);
          }
        }
      });
    } catch {
      // The calculator remains fully usable if a device has no accelerometer.
    }

    return () => subscription?.remove();
  }, []);

  const handlePress = (button: string) => {
    if (button === 'AC') {
      hiddenDigits.current = '';
      emptySince.current = null;
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
    const nextExpression = appendCalculatorInput(expression, button, isEvaluated);
    if (nextExpression !== null) {
      setExpression(nextExpression);
      setIsEvaluated(false);
    }
  };

  const swipeDelete = () => {
    const currentExpression = expressionRef.current;
    if (
      !magicEnabledRef.current ||
      !currentExpression ||
      !SIMPLE_NUMBER.test(currentExpression)
    ) {
      return;
    }
    if (!hiddenDigits.current) hiddenDigits.current = currentExpression;
    const nextExpression = currentExpression.slice(0, -1);
    if (!nextExpression) {
      emptySince.current = Date.now();
    }
    setExpression(nextExpression);
    setIsEvaluated(false);
  };

  const unlockMagic = () => {
    setMagicEnabled(true);
  };

  return {
    expression,
    resultPreview,
    isEvaluated,
    magicEnabled,
    handlePress,
    swipeDelete,
    unlockMagic,
  };
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
