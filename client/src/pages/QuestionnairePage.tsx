import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { QuestionField } from '../components/QuestionField';
import type {
  Assessment,
  DomainGroup,
  SavedResponse,
} from '../types';
import { useDocumentTitle } from '../useDocumentTitle';

export function QuestionnairePage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainGroup[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [domainIndex, setDomainIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingSaves, setPendingSaves] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const domainHeadingRef = useRef<HTMLParagraphElement>(null);
  const skipInitialFocus = useRef(true);

  useDocumentTitle('Risk questionnaire — CyberShield');

  useEffect(() => {
    if (skipInitialFocus.current) {
      skipInitialFocus.current = false;
      return;
    }
    domainHeadingRef.current?.focus();
  }, [domainIndex]);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function load() {
      try {
        const questions = await api<{ domains: DomainGroup[] }>(
          '/api/questions',
          { token },
        );
        setDomains(questions.domains);

        let current: { assessment: Assessment; responses: SavedResponse[] };
        try {
          current = await api('/api/assessments/current', { token });
        } catch (err) {
          if (!(err instanceof ApiError) || err.status !== 404) {
            throw err;
          }
          const created = await api<{ assessment: Assessment }>(
            '/api/assessments',
            { method: 'POST', token },
          );
          current = { assessment: created.assessment, responses: [] };
        }

        setAssessment(current.assessment);
        sessionStorage.setItem('cybershield.assessmentId', current.assessment.id);
        const nextAnswers: Record<string, string> = {};
        for (const response of current.responses) {
          nextAnswers[response.question_id] = response.answer_value;
        }
        setAnswers(nextAnswers);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load the questionnaire.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [token]);

  const currentDomain = domains[domainIndex];
  const isLastDomain = domainIndex === domains.length - 1;
  const currentComplete = useMemo(() => {
    if (!currentDomain) {
      return false;
    }
    return currentDomain.questions.every((question) => answers[question.id]);
  }, [answers, currentDomain]);

  async function saveAnswer(questionId: string, value: string) {
    if (!token || !assessment) {
      return;
    }

    setAnswers((current) => ({ ...current, [questionId]: value }));
    setError(null);
    setPendingSaves((count) => count + 1);
    try {
      await api(`/api/assessments/${assessment.id}/responses`, {
        method: 'POST',
        token,
        body: { question_id: questionId, answer_value: value },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save that answer.');
    } finally {
      setPendingSaves((count) => count - 1);
    }
  }

  async function handleComplete() {
    if (!token || !assessment) {
      return;
    }
    setCompleting(true);
    setError(null);
    try {
      const result = await api<{ assessment: Assessment }>(
        `/api/assessments/${assessment.id}/complete`,
        { method: 'POST', token },
      );
      sessionStorage.setItem(
        'cybershield.assessmentId',
        result.assessment.id,
      );
      navigate('/complete', { state: { assessment: result.assessment } });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not complete the assessment.',
      );
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="page wide">
        <div className="card">
      <header className="app-header">
        <div>
          <p className="eyebrow">CyberShield</p>
          <h1>Risk questionnaire</h1>
        </div>
        <div className="session">
          <p>
            Signed in as <strong>{user?.email}</strong>
          </p>
          <button type="button" className="secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main id="main">
        {loading && <p>Loading questions…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {currentDomain && (
          <form
            data-domain-panel={currentDomain.id}
            onSubmit={(event) => event.preventDefault()}
          >
            <p
              className="progress"
              aria-live="polite"
              tabIndex={-1}
              ref={domainHeadingRef}
            >
              Domain {domainIndex + 1} of {domains.length}: {currentDomain.label}
            </p>

            <fieldset className="domain-group">
              <legend>{currentDomain.label}</legend>
              {currentDomain.questions.map((question) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  value={answers[question.id] ?? ''}
                  onChange={saveAnswer}
                />
              ))}
            </fieldset>

            <p className="hint" aria-live="polite">
              {pendingSaves > 0 ? 'Saving answers…' : 'Answers save as you select them.'}
            </p>

            <div className="actions">
              <button
                type="button"
                className="secondary"
                disabled={domainIndex === 0}
                onClick={() => setDomainIndex((index) => index - 1)}
              >
                Previous domain
              </button>
              {!isLastDomain && (
                <button
                  type="button"
                  disabled={!currentComplete || pendingSaves > 0}
                  onClick={() => setDomainIndex((index) => index + 1)}
                >
                  Next domain
                </button>
              )}
              {isLastDomain && (
                <button
                  type="button"
                  disabled={!currentComplete || pendingSaves > 0 || completing}
                  onClick={() => void handleComplete()}
                >
                  {completing ? 'Completing…' : 'Complete assessment'}
                </button>
              )}
            </div>
          </form>
        )}
      </main>
        </div>
      </div>
    </div>
  );
}
