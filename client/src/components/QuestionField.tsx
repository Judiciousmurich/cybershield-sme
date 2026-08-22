import { choiceLabel, SCALE_LABELS } from '../labels';
import type { Question } from '../types';

type QuestionFieldProps = {
  question: Question;
  value: string;
  onChange: (questionId: string, value: string) => void;
};

export function QuestionField({
  question,
  value,
  onChange,
}: QuestionFieldProps) {
  const options = buildOptions(question);

  return (
    <fieldset className="question" data-question-id={question.id}>
      <legend>{question.text}</legend>
      <div className="options">
        {options.map((option) => {
          const inputId = `${question.id}-${option.value}`;
          return (
            <label key={option.value} className="option" htmlFor={inputId}>
              <input
                id={inputId}
                type="radio"
                name={`question-${question.id}`}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(question.id, option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function buildOptions(question: Question): { value: string; label: string }[] {
  if (question.answer_type === 'scale') {
    const min = question.options?.min ?? 1;
    const max = question.options?.max ?? 5;
    const values: { value: string; label: string }[] = [];
    for (let score = min; score <= max; score += 1) {
      values.push({
        value: String(score),
        label: SCALE_LABELS[score] ?? String(score),
      });
    }
    return values;
  }

  return (question.options?.choices ?? []).map((choice) => ({
    value: choice,
    label: choiceLabel(choice),
  }));
}
