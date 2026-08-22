/**
 * CyberShield scoring
 * --------------------
 * Domain mapping (NIST Cybersecurity Framework 1.1 / 2.0 groupings):
 *   access_control               → Protect: Identity Management, Authentication
 *                                  and Access Control (PR.AA / legacy PR.AC)
 *   data_backup                  → Recover: Recovery Planning (RC.RP) and
 *                                  Protect: Data Security (PR.DS)
 *   network_device_security      → Protect: Platform Security / Technology
 *                                  Infrastructure (PR.PS) and Identify: Asset
 *                                  Management (ID.AM) for SME routers and Wi-Fi
 *   security_awareness           → Protect: Awareness and Training (PR.AT)
 *   incident_response_readiness  → Respond (RS.MA / RS.CO) and Recover (RC.CO)
 *
 * These five questionnaire domains are not a full CSF profile. They are the
 * CSF function areas that most often fail first in a small or medium business
 * with no dedicated security team.
 *
 * Per-question earned points:
 *   yes_no           yes = full weight, no = 0
 *   scale            linear from options.min (0) to options.max (full weight)
 *   multiple_choice  known SME answers are mapped (good / partial / poor);
 *                    unknown choices fall back to first-is-best order
 *
 * Domain score (%)  = sum(earned) / sum(weight) × 100
 * Overall score (%) = mean of the five domain percentages so a domain with
 *                     more questions cannot dominate the headline figure
 *
 * Risk bands (applied to the rounded overall percentage):
 *   High   0  ≤ score <  HIGH_RISK_MAX   (40)
 *   Medium 40 ≤ score <  LOW_RISK_MIN    (70)
 *   Low    70 ≤ score ≤ 100
 *
 * A higher score means stronger control coverage and therefore a lower
 * residual-risk band.
 */

import {
  DOMAIN_LABELS,
  DOMAIN_ORDER,
  type QuestionDomain,
  type QuestionRecord,
  type ResponseRecord,
} from '../types.js';

export const HIGH_RISK_MAX = 40;
export const LOW_RISK_MIN = 70;

export type RiskBand = 'Low' | 'Medium' | 'High';

export type AnswerScore = {
  earned: number;
  max: number;
};

export type DomainScore = {
  domain: QuestionDomain;
  label: string;
  earned: number;
  max_score: number;
  score: number;
  risk_band: RiskBand;
};

export type AssessmentScore = {
  overall: number;
  risk_band: RiskBand;
  rationale: string;
  domains: DomainScore[];
};

const CHOICE_FRACTION: Record<string, number> = {
  yes: 1,
  no: 0,
  every_quarter: 1,
  at_least_quarterly: 1,
  once_a_year: 0.5,
  rarely_or_never: 0,
  only_when_something_breaks: 0,
};

export function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

export function riskBand(percentage: number): RiskBand {
  if (percentage < HIGH_RISK_MAX) {
    return 'High';
  }
  if (percentage < LOW_RISK_MIN) {
    return 'Medium';
  }
  return 'Low';
}

export function scoreAnswer(
  question: QuestionRecord,
  answerValue: string | undefined,
): AnswerScore {
  const max = question.weight;
  if (answerValue === undefined || answerValue === '') {
    return { earned: 0, max };
  }

  if (question.answer_type === 'yes_no') {
    return { earned: answerValue === 'yes' ? max : 0, max };
  }

  if (question.answer_type === 'scale') {
    const min = Number(question.options?.min ?? 1);
    const top = Number(question.options?.max ?? 5);
    const numeric = Number(answerValue);
    if (!Number.isFinite(numeric) || top === min) {
      return { earned: 0, max };
    }
    const fraction = Math.min(1, Math.max(0, (numeric - min) / (top - min)));
    return { earned: fraction * max, max };
  }

  const choices = Array.isArray(question.options?.choices)
    ? question.options.choices.filter((item): item is string => typeof item === 'string')
    : [];
  const known = CHOICE_FRACTION[answerValue];
  if (known !== undefined) {
    return { earned: known * max, max };
  }
  const index = choices.indexOf(answerValue);
  if (index < 0 || choices.length <= 1) {
    return { earned: 0, max };
  }
  const fraction = 1 - index / (choices.length - 1);
  return { earned: fraction * max, max };
}

export function scoreDomain(
  domain: QuestionDomain,
  questions: QuestionRecord[],
  answers: Record<string, string>,
): DomainScore {
  const domainQuestions = questions.filter((question) => question.domain === domain);
  let earned = 0;
  let max = 0;
  for (const question of domainQuestions) {
    const points = scoreAnswer(question, answers[question.id]);
    earned += points.earned;
    max += points.max;
  }
  const score = max === 0 ? 0 : roundScore((earned / max) * 100);
  return {
    domain,
    label: DOMAIN_LABELS[domain],
    earned: roundScore(earned),
    max_score: roundScore(max),
    score,
    risk_band: riskBand(score),
  };
}

export function scoreAssessment(
  questions: QuestionRecord[],
  responses: Pick<ResponseRecord, 'question_id' | 'answer_value'>[],
): AssessmentScore {
  const answers = Object.fromEntries(
    responses.map((response) => [response.question_id, response.answer_value]),
  );
  const domains = DOMAIN_ORDER.map((domain) =>
    scoreDomain(domain, questions, answers),
  );
  const overall =
    domains.length === 0
      ? 0
      : roundScore(
          domains.reduce((sum, domain) => sum + domain.score, 0) / domains.length,
        );

  return {
    overall,
    risk_band: riskBand(overall),
    rationale: buildRationale(overall, domains),
    domains,
  };
}

export function buildRationale(
  overall: number,
  domains: DomainScore[],
): string {
  const band = riskBand(overall);
  const weakest = [...domains].sort((a, b) => a.score - b.score)[0];
  const strongest = [...domains].sort((a, b) => b.score - a.score)[0];

  if (band === 'Low') {
    return `Overall score ${overall}% sits at or above ${LOW_RISK_MIN}%, so residual risk is Low. ${strongest.label} is the strongest area (${strongest.score}%). Keep reviewing access and backups as the business grows.`;
  }
  if (band === 'Medium') {
    return `Overall score ${overall}% is in the Medium band (${HIGH_RISK_MAX}–${LOW_RISK_MIN - 0.1}%). ${weakest.label} is the weakest area at ${weakest.score}% and should be treated first.`;
  }
  return `Overall score ${overall}% is below ${HIGH_RISK_MAX}%, so residual risk is High. ${weakest.label} scored ${weakest.score}%. For an SME this usually means a single incident (mailbox takeover, ransomware, or a lost device) could stop trading.`;
}
