import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApiError, api, downloadPdf } from '../api';
import { useAuth } from '../auth/AuthContext';
import type { Assessment, AssessmentResults } from '../types';
import { useDocumentTitle } from '../useDocumentTitle';

type LocationState = {
  assessment?: Assessment;
};

export function CompletePage() {
  const { token, user, updateBusinessContext } = useAuth();
  useDocumentTitle('Assessment results — CyberShield');
  const location = useLocation();
  const fromState = (location.state as LocationState | null)?.assessment;
  const assessmentId =
    fromState?.id ?? sessionStorage.getItem('cybershield.assessmentId');

  const [assessment, setAssessment] = useState<Assessment | null>(
    fromState ?? null,
  );
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState(user?.business_context ?? '');
  const [savingContext, setSavingContext] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!token || !assessmentId) {
      setError('No completed assessment was found for this session.');
      return;
    }

    api<{ assessment: Assessment; results: AssessmentResults }>(
      `/api/assessments/${assessmentId}/results`,
      { token },
    )
      .then((payload) => {
        setAssessment(payload.assessment);
        setResults(payload.results);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : 'Could not load results.',
        );
      });
  }, [assessmentId, token]);

  const status = assessment?.status ?? 'completed';

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="page wide">
        <div className="card">
      <header>
        <p className="eyebrow">CyberShield</p>
        <h1>Assessment complete</h1>
      </header>
      <main id="main">
        <p data-cy="assessment-status">
          Status: <strong>{status}</strong>
        </p>
        {assessment && (
          <p>
            Assessment ID: <code>{assessment.id}</code>
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {results && (
          <>
            <section aria-labelledby="overall-heading">
              <h2 id="overall-heading">Overall score</h2>
              <p className="score-hero">
                <span className="score-value">{results.overall.score}%</span>
                <span className={`band band-${results.overall.risk_band.toLowerCase()}`}>
                  {results.overall.risk_band} risk
                </span>
              </p>
              <p>{results.overall.rationale}</p>
            </section>

            <section aria-labelledby="domain-heading">
              <h2 id="domain-heading">Scores by domain</h2>
              <table className="scores">
                <caption>Weighted domain scores as a percentage of the maximum</caption>
                <thead>
                  <tr>
                    <th scope="col">Domain</th>
                    <th scope="col">Score</th>
                    <th scope="col">Risk band</th>
                  </tr>
                </thead>
                <tbody>
                  {results.domains.map((domain) => (
                    <tr key={domain.domain}>
                      <th scope="row">{domain.label}</th>
                      <td>
                        <meter
                          min={0}
                          max={100}
                          value={domain.score}
                          aria-label={`${domain.label} ${domain.score} percent`}
                        >
                          {domain.score}%
                        </meter>{' '}
                        {domain.score}%
                      </td>
                      <td>{domain.risk_band}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section aria-labelledby="reco-heading">
              <h2 id="reco-heading">Prioritised recommendations</h2>
              {results.recommendations.length === 0 ? (
                <p>
                  No domain scored below the Low-risk threshold. Keep reviewing
                  access and backups as the business changes.
                </p>
              ) : (
                <ol className="recommendations">
                  {results.recommendations.map((item) => (
                    <li key={`${item.domain}-${item.priority}`}>
                      <h3>
                        {item.priority}. {item.title}
                      </h3>
                      <p>{item.detail}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section aria-labelledby="context-heading">
              <h2 id="context-heading">Business context (optional)</h2>
              <p className="hint" id="context-help">
                A short note about the firm (sector, headcount, or key systems)
                is printed on the PDF report.
              </p>
              <div className="field">
                <label htmlFor="business-context">Business context</label>
                <textarea
                  id="business-context"
                  name="business_context"
                  rows={3}
                  maxLength={500}
                  autoComplete="organization"
                  value={context}
                  aria-describedby="context-help"
                  onChange={(event) => setContext(event.target.value)}
                />
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={savingContext}
                  onClick={() => {
                    setSavingContext(true);
                    updateBusinessContext(context)
                      .catch((err: unknown) => {
                        setError(
                          err instanceof ApiError
                            ? err.message
                            : 'Could not save business context.',
                        );
                      })
                      .finally(() => setSavingContext(false));
                  }}
                >
                  {savingContext ? 'Saving…' : 'Save context'}
                </button>
                <button
                  type="button"
                  disabled={downloading || !assessmentId || !token}
                  onClick={() => {
                    if (!token || !assessmentId) {
                      return;
                    }
                    setDownloading(true);
                    downloadPdf(
                      `/api/assessments/${assessmentId}/report`,
                      token,
                    )
                      .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `cybershield-report-${assessmentId}.pdf`;
                        link.click();
                        URL.revokeObjectURL(url);
                      })
                      .catch((err: unknown) => {
                        setError(
                          err instanceof ApiError
                            ? err.message
                            : 'Could not download the report.',
                        );
                      })
                      .finally(() => setDownloading(false));
                  }}
                >
                  {downloading ? 'Preparing PDF…' : 'Download Report'}
                </button>
              </div>
            </section>
          </>
        )}

        <p>
          <Link to="/questionnaire">Start another assessment</Link>
        </p>
      </main>
        </div>
      </div>
    </div>
  );
}
