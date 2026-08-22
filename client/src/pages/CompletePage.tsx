import { Link, useLocation } from 'react-router-dom';
import type { Assessment } from '../types';

type LocationState = {
  assessment?: Assessment;
};

export function CompletePage() {
  const location = useLocation();
  const assessment = (location.state as LocationState | null)?.assessment;
  const status = assessment?.status ?? 'completed';

  return (
    <div className="page">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
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
        <p>
          Scoring and a downloadable report arrive in the next phases. You can
          start another assessment from the questionnaire.
        </p>
        <p>
          <Link to="/questionnaire">Return to questionnaire</Link>
        </p>
      </main>
    </div>
  );
}
