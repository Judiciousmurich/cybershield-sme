import {
  HIGH_RISK_MAX,
  LOW_RISK_MIN,
  riskBand,
  scoreAssessment,
  scoreDomain,
  type DomainScore,
} from '../src/scoring/engine.js';
import { recommendationsFor } from '../src/scoring/recommendations.js';
import type { QuestionRecord } from '../src/types.js';

function question(
  overrides: Partial<QuestionRecord> & Pick<QuestionRecord, 'id' | 'domain'>,
): QuestionRecord {
  return {
    text: 'Sample',
    weight: 2,
    answer_type: 'yes_no',
    options: { choices: ['yes', 'no'] },
    active: true,
    ...overrides,
  };
}

describe('domain scoring', () => {
  test('weighted yes/no answers produce a known percentage', () => {
    const questions = [
      question({ id: 'q-yes', domain: 'access_control', weight: 3 }),
      question({ id: 'q-no', domain: 'access_control', weight: 1 }),
    ];

    const result = scoreDomain('access_control', questions, {
      'q-yes': 'yes',
      'q-no': 'no',
    });

    // earned 3 of max 4 → 75%
    expect(result.earned).toBe(3);
    expect(result.max_score).toBe(4);
    expect(result.score).toBe(75);
    expect(result.risk_band).toBe('Low');
  });
});

describe('overall score aggregation', () => {
  test('overall is the mean of the five domain percentages', () => {
    const questions = [
      question({ id: 'ac', domain: 'access_control', weight: 1 }),
      question({ id: 'bk', domain: 'data_backup', weight: 1 }),
      question({ id: 'nw', domain: 'network_device_security', weight: 1 }),
      question({ id: 'aw', domain: 'security_awareness', weight: 1 }),
      question({ id: 'ir', domain: 'incident_response_readiness', weight: 1 }),
    ];

    const scored = scoreAssessment(questions, [
      { question_id: 'ac', answer_value: 'yes' },
      { question_id: 'bk', answer_value: 'yes' },
      { question_id: 'nw', answer_value: 'no' },
      { question_id: 'aw', answer_value: 'no' },
      { question_id: 'ir', answer_value: 'yes' },
    ]);

    // domain %: 100, 100, 0, 0, 100 → mean 60
    expect(scored.domains.map((domain) => domain.score)).toEqual([
      100, 100, 0, 0, 100,
    ]);
    expect(scored.overall).toBe(60);
    expect(scored.risk_band).toBe('Medium');
  });
});

describe('risk-band boundaries', () => {
  test('exactly at the Low threshold is Low', () => {
    expect(riskBand(LOW_RISK_MIN)).toBe('Low');
  });

  test('just below the Low threshold is Medium', () => {
    expect(riskBand(LOW_RISK_MIN - 0.1)).toBe('Medium');
  });

  test('exactly at the High/Medium threshold is Medium', () => {
    expect(riskBand(HIGH_RISK_MAX)).toBe('Medium');
  });

  test('just below the High/Medium threshold is High', () => {
    expect(riskBand(HIGH_RISK_MAX - 0.1)).toBe('High');
  });
});

describe('recommendations', () => {
  test('prioritises the weakest domain below the Low-risk threshold', () => {
    const domains = [
      { domain: 'access_control', label: 'Access control', score: 80, earned: 8, max_score: 10, risk_band: 'Low' },
      { domain: 'data_backup', label: 'Data backup', score: 20, earned: 2, max_score: 10, risk_band: 'High' },
    ] as DomainScore[];

    const items = recommendationsFor(domains);
    expect(items[0].domain).toBe('data_backup');
    expect(items[0].priority).toBe(1);
    expect(items.some((item) => item.domain === 'access_control')).toBe(false);
    expect(items[0].detail).toMatch(/ransomware|offline|backup/i);
  });
});
