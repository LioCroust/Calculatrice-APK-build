type Value = {
  value: number;
  isPercentage: boolean;
};

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '%' }
  | { type: 'parenthesis'; value: '(' | ')' };

const OPERATORS = ['+', '-', '×', '÷'] as const;

function tokenize(expression: string): Token[] | null {
  const normalized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.');
  const tokens: Token[] = [];
  let index = 0;

  while (index < normalized.length) {
    const character = normalized[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    const numberMatch = normalized.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (numberMatch) {
      const value = Number(numberMatch[0]);
      if (!Number.isFinite(value)) return null;
      tokens.push({ type: 'number', value });
      index += numberMatch[0].length;
      continue;
    }

    if ('+-*/%'.includes(character)) {
      tokens.push({
        type: 'operator',
        value: character as '+' | '-' | '*' | '/' | '%',
      });
      index += 1;
      continue;
    }

    if (character === '(' || character === ')') {
      tokens.push({ type: 'parenthesis', value: character });
      index += 1;
      continue;
    }

    return null;
  }

  return tokens;
}

export function evaluateMath(
  expression: string,
  allowTrailingOperator = false,
): number | null {
  let input = expression.trim();
  if (!input) return null;

  if (allowTrailingOperator && /[+×÷-]$/.test(input)) {
    const operatorIndex = input.length - 1;
    const operator = input[operatorIndex];
    const previous = input[operatorIndex - 1];
    const isUnaryMinus =
      operator === '-' &&
      (operatorIndex === 0 || previous === '(' || OPERATORS.includes(previous as typeof OPERATORS[number]));
    if (!isUnaryMinus) input = input.slice(0, -1);
  }

  if (!input) return null;
  const openCount = (input.match(/\(/g) ?? []).length;
  const closeCount = (input.match(/\)/g) ?? []).length;
  if (closeCount > openCount) return null;
  input += ')'.repeat(openCount - closeCount);

  const tokens = tokenize(input);
  if (!tokens?.length) return null;

  let position = 0;
  const peek = () => tokens[position];
  const consume = () => tokens[position++];

  function parsePrimary(): Value {
    const token = consume();
    if (!token) throw new Error('Missing value');

    if (token.type === 'number') {
      return { value: token.value, isPercentage: false };
    }

    if (token.type === 'parenthesis' && token.value === '(') {
      const value = parseExpression();
      const closing = consume();
      if (closing?.type !== 'parenthesis' || closing.value !== ')') {
        throw new Error('Unclosed parenthesis');
      }
      return value;
    }

    throw new Error('Expected a number or an opening parenthesis');
  }

  function parsePostfix(): Value {
    let value = parsePrimary();
    while (peek()?.type === 'operator' && peek()?.value === '%') {
      consume();
      value = { value: value.value / 100, isPercentage: true };
    }
    return value;
  }

  function parseUnary(): Value {
    const token = peek();
    if (token?.type === 'operator' && (token.value === '+' || token.value === '-')) {
      consume();
      const value = parseUnary();
      return {
        value: token.value === '-' ? -value.value : value.value,
        isPercentage: value.isPercentage,
      };
    }
    return parsePostfix();
  }

  function parseTerm(): Value {
    let left = parseUnary();
    while (true) {
      const token = peek();
      if (token?.type !== 'operator' || (token.value !== '*' && token.value !== '/')) {
        return left;
      }
      consume();
      const right = parseUnary();
      left = {
        value: token.value === '*' ? left.value * right.value : left.value / right.value,
        isPercentage: false,
      };
    }
  }

  function parseExpression(): Value {
    let left = parseTerm();
    while (true) {
      const token = peek();
      if (
        token?.type !== 'operator' ||
        (token.value !== '+' && token.value !== '-')
      ) {
        return left;
      }
      consume();
      const right = parseTerm();
      const rightValue =
        right.isPercentage ? left.value * right.value : right.value;
      left = {
        value:
          token.value === '+'
            ? left.value + rightValue
            : left.value - rightValue,
        isPercentage: false,
      };
    }
  }

  try {
    const result = parseExpression();
    if (position !== tokens.length || !Number.isFinite(result.value)) return null;
    return Math.round(result.value * 1_000_000_000) / 1_000_000_000;
  } catch {
    return null;
  }
}

function isValueEnding(character: string): boolean {
  return /[\d,)%]/.test(character);
}

function getCurrentNumberStart(expression: string): number {
  let index = expression.length - 1;
  while (index >= 0 && /[\d,]/.test(expression[index])) index -= 1;

  if (
    expression[index] === '-' &&
    (index === 0 || expression[index - 1] === '(' || OPERATORS.includes(expression[index - 1] as typeof OPERATORS[number]))
  ) {
    return index;
  }
  return index + 1;
}

export function appendCalculatorInput(
  expression: string,
  button: string,
  isEvaluated: boolean,
): string | null {
  const continueAfterResult =
    isEvaluated && (button === '%' || OPERATORS.includes(button as typeof OPERATORS[number]));
  const current = isEvaluated && !continueAfterResult ? '' : expression;

  if (button === '( )') {
    if (isEvaluated || !current) return '(';

    const opens = (current.match(/\(/g) ?? []).length;
    const closes = (current.match(/\)/g) ?? []).length;
    const last = current.slice(-1);

    if (opens > closes && isValueEnding(last)) return `${current})`;
    if (OPERATORS.includes(last as typeof OPERATORS[number]) || last === '(') {
      return `${current}(`;
    }
    return `${current}×(`;
  }

  if (button === ',') {
    if (isEvaluated) return '0,';
    const last = current.slice(-1);
    if (last === ')' || last === '%') return `${current}×0,`;

    const numberStart = getCurrentNumberStart(current);
    const currentNumber = current.slice(numberStart);
    if (currentNumber.includes(',')) return null;
    if (!currentNumber || currentNumber === '-') return `${current}0,`;
    return `${current},`;
  }

  if (button === '%') {
    if (!current || !isValueEnding(current.slice(-1))) return null;
    return `${current}%`;
  }

  if (OPERATORS.includes(button as typeof OPERATORS[number])) {
    const last = current.slice(-1);
    if (!current) return button === '-' ? '-' : null;
    if (last === '(') return button === '-' ? `${current}-` : null;

    const lastIsUnaryMinus =
      last === '-' &&
      (current.length === 1 ||
        current[current.length - 2] === '(' ||
        OPERATORS.includes(current[current.length - 2] as typeof OPERATORS[number]));
    if (lastIsUnaryMinus) return null;

    if (OPERATORS.includes(last as typeof OPERATORS[number])) {
      return `${current.slice(0, -1)}${button}`;
    }
    if (last === ',') return null;
    return `${current}${button}`;
  }

  if (/^\d$/.test(button)) {
    if (isEvaluated) return button;
    const last = current.slice(-1);
    if (last === ')' || last === '%') return `${current}×${button}`;

    const numberStart = getCurrentNumberStart(current);
    const currentNumber = current.slice(numberStart);
    if (currentNumber === '0' || currentNumber === '-0') {
      return `${current.slice(0, numberStart)}${button}`;
    }
    return `${current}${button}`;
  }

  return null;
}