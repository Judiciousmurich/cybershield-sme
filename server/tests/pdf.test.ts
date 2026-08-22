import { buildReportPdf } from '../src/reports/pdf.js';
import type { ResultsPayload } from '../src/scoring/results.js';

const results: ResultsPayload = {
  assessment_id: 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff',
  overall: {
    score: 62,
    risk_band: 'Medium',
    rationale: 'Overall score 62% is in the Medium band.',
  },
  domains: [
    {
      domain: 'access_control',
      label: 'Access control',
      score: 75,
      earned: 6,
      max_score: 8,
      risk_band: 'Low',
    },
    {
      domain: 'data_backup',
      label: 'Data backup',
      score: 40,
      earned: 4,
      max_score: 10,
      risk_band: 'Medium',
    },
  ],
  recommendations: [
    {
      domain: 'data_backup',
      priority: 1,
      title: 'Keep one backup the ransomware cannot reach',
      detail: 'Use an offline or separate-account copy.',
    },
  ],
};

describe('PDF report', () => {
  test('produces a PDF buffer that starts with the PDF magic bytes', async () => {
    const pdf = await buildReportPdf(
      {
        id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        email: 'owner@sme.example',
        role: 'user',
        created_at: new Date(),
        business_context: '12-person accountancy practice using Microsoft 365.',
      },
      results,
    );

    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(200);
  });
});
