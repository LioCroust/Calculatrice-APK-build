import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendCalculatorInput,
  evaluateMath,
} from './calculatorMath.ts';

test('calculates percentages as values and relative additions/subtractions', () => {
  assert.equal(evaluateMath('50%'), 0.5);
  assert.equal(evaluateMath('200+10%'), 220);
  assert.equal(evaluateMath('200-10%'), 180);
  assert.equal(evaluateMath('200×10%'), 20);
  assert.equal(evaluateMath('200÷10%'), 2000);
  assert.equal(evaluateMath('200+10%+10%'), 242);
});

test('supports decimal commas, operator precedence, parentheses, and unary signs', () => {
  assert.equal(evaluateMath('0,5×2'), 1);
  assert.equal(evaluateMath('2+3×4'), 14);
  assert.equal(evaluateMath('2×(3+4)'), 14);
  assert.equal(evaluateMath('2×(3+4'), 14);
  assert.equal(evaluateMath('(-2)×3'), -6);
  assert.equal(evaluateMath('-(2+3)'), -5);
});

test('rejects incomplete or invalid calculations', () => {
  assert.equal(evaluateMath('2+'), null);
  assert.equal(evaluateMath('2÷0'), null);
  assert.equal(evaluateMath('2+)'), null);
  assert.equal(evaluateMath('2+3', true), 5);
});

test('accepts only valid percentage, decimal, and parenthesis inputs', () => {
  assert.equal(appendCalculatorInput('', '%', false), null);
  assert.equal(appendCalculatorInput('2+', '%', false), null);
  assert.equal(appendCalculatorInput('2,3', ',', false), null);
  assert.equal(appendCalculatorInput('2', '( )', false), '2×(');
  assert.equal(appendCalculatorInput('2×(3', '( )', false), '2×(3)');
  assert.equal(appendCalculatorInput('2)', '4', false), '2)×4');
  assert.equal(appendCalculatorInput('50', '%', false), '50%');
});

test('continues a completed result and starts a new number after digits', () => {
  assert.equal(appendCalculatorInput('220', '+', true), '220+');
  assert.equal(appendCalculatorInput('220', '%', true), '220%');
  assert.equal(appendCalculatorInput('220', '5', true), '5');
  assert.equal(appendCalculatorInput('220', ',', true), '0,');
});