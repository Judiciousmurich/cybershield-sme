import type { QuestionRecord } from '../types.js';

export function validateAnswerValue(
  question: QuestionRecord,
  answerValue: unknown,
): string | null {
  if (typeof answerValue !== 'string' || answerValue.trim() === '') {
    return 'Answer value is required.';
  }

  const value = answerValue.trim();

  if (!question.active) {
    return 'This question is no longer active.';
  }

  if (
    question.answer_type === 'yes_no' ||
    question.answer_type === 'multiple_choice'
  ) {
    const choices = question.options?.choices;
    if (!Array.isArray(choices) || !choices.every((item) => typeof item === 'string')) {
      return 'Question is missing valid answer options.';
    }
    if (!choices.includes(value)) {
      return `Answer must be one of: ${choices.join(', ')}.`;
    }
    return null;
  }

  if (question.answer_type === 'scale') {
    const min = Number(question.options?.min ?? 1);
    const max = Number(question.options?.max ?? 5);
    if (!/^-?\d+$/.test(value)) {
      return `Answer must be a whole number between ${min} and ${max}.`;
    }
    const numeric = Number(value);
    if (numeric < min || numeric > max) {
      return `Answer must be a whole number between ${min} and ${max}.`;
    }
    return null;
  }

  return 'Unsupported answer type.';
}

export const ASSESSMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAssessmentId(value: string): boolean {
  return ASSESSMENT_ID_PATTERN.test(value);
}
