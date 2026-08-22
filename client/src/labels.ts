export const CHOICE_LABELS: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  every_quarter: 'Every quarter',
  once_a_year: 'Once a year',
  rarely_or_never: 'Rarely or never',
  at_least_quarterly: 'At least quarterly',
  only_when_something_breaks: 'Only when something breaks',
};

export const SCALE_LABELS: Record<number, string> = {
  1: '1 — Not at all',
  2: '2 — Slightly',
  3: '3 — Somewhat',
  4: '4 — Mostly',
  5: '5 — Completely',
};

export function choiceLabel(value: string): string {
  return CHOICE_LABELS[value] ?? value.replaceAll('_', ' ');
}
