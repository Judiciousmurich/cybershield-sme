import { validateAnswerValue } from '../src/validation/answers.js';
import type { QuestionRecord } from '../src/types.js';

function question(
  overrides: Partial<QuestionRecord> = {},
): QuestionRecord {
  return {
    id: '11111111-1111-4111-8111-111111111101',
    domain: 'access_control',
    text: 'Sample question',
    weight: 1,
    answer_type: 'yes_no',
    options: { choices: ['yes', 'no'] },
    active: true,
    ...overrides,
  };
}

describe('validateAnswerValue', () => {
  test('accepts a valid yes/no answer', () => {
    expect(validateAnswerValue(question(), 'yes')).toBeNull();
  });

  test('rejects an answer that is not in the allowed options', () => {
    expect(validateAnswerValue(question(), 'maybe')).toMatch(/must be one of/i);
  });

  test('accepts a scale value on the boundary', () => {
    const scale = question({
      answer_type: 'scale',
      options: { min: 1, max: 5 },
    });
    expect(validateAnswerValue(scale, '1')).toBeNull();
    expect(validateAnswerValue(scale, '5')).toBeNull();
  });

  test('rejects a scale value outside the range', () => {
    const scale = question({
      answer_type: 'scale',
      options: { min: 1, max: 5 },
    });
    expect(validateAnswerValue(scale, '6')).toMatch(/between 1 and 5/i);
  });
});
