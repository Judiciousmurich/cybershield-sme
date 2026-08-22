import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useDocumentTitle } from '../useDocumentTitle';

export function AuthPage() {
  const { token, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle(
    mode === 'login' ? 'Log in — CyberShield' : 'Register — CyberShield',
  );

  if (token) {
    return <Navigate to="/questionnaire" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="page">
        <div className="card">
          <header>
            <p className="eyebrow">Cybersecurity risk assessment</p>
            <h1>CyberShield</h1>
            <p className="lede">
              Sign in to start a short questionnaire about how your business
              handles access, backups, devices, awareness, and incidents.
            </p>
          </header>

          <main id="main">
            <div className="mode-switch" role="group" aria-label="Account action">
              <button
                type="button"
                className={mode === 'login' ? 'active' : undefined}
                aria-pressed={mode === 'login'}
                onClick={() => setMode('login')}
              >
                Log in
              </button>
              <button
                type="button"
                className={mode === 'register' ? 'active' : undefined}
                aria-pressed={mode === 'register'}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <h2>{mode === 'login' ? 'Log in' : 'Create an account'}</h2>
              {error && (
                <p className="error" role="alert" id="form-error">
                  {error}
                </p>
              )}
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'form-error' : undefined}
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? 'form-error password-help' : 'password-help'
                  }
                />
                <p id="password-help" className="hint">
                  At least 8 characters, including one letter and one number.
                </p>
              </div>
              <button type="submit" disabled={submitting}>
                {submitting
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Log in'
                    : 'Register and continue'}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
