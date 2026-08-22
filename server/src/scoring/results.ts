import { listResponses } from '../db/assessments.js';
import { listActiveQuestions } from '../db/questions.js';
import { replaceRiskScores } from '../db/riskScores.js';
import { DOMAIN_LABELS } from '../types.js';
import { scoreAssessment, type AssessmentScore } from './engine.js';
import { recommendationsFor, type Recommendation } from './recommendations.js';

export type ResultsPayload = {
  assessment_id: string;
  overall: {
    score: number;
    risk_band: AssessmentScore['risk_band'];
    rationale: string;
  };
  domains: {
    domain: string;
    label: string;
    score: number;
    earned: number;
    max_score: number;
    risk_band: AssessmentScore['risk_band'];
  }[];
  recommendations: Recommendation[];
};

export async function calculateAndStoreResults(
  assessmentId: string,
): Promise<ResultsPayload> {
  const [questions, responses] = await Promise.all([
    listActiveQuestions(),
    listResponses(assessmentId),
  ]);
  const scored = scoreAssessment(questions, responses);
  await replaceRiskScores(
    assessmentId,
    scored.domains.map((domain) => ({
      domain: domain.domain,
      score: domain.earned,
      max_score: domain.max_score,
    })),
  );

  return {
    assessment_id: assessmentId,
    overall: {
      score: scored.overall,
      risk_band: scored.risk_band,
      rationale: scored.rationale,
    },
    domains: scored.domains.map((domain) => ({
      domain: domain.domain,
      label: DOMAIN_LABELS[domain.domain],
      score: domain.score,
      earned: domain.earned,
      max_score: domain.max_score,
      risk_band: domain.risk_band,
    })),
    recommendations: recommendationsFor(scored.domains),
  };
}
