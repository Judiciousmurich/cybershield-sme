import { useEffect, useState } from 'react';
import './App.css';

type HealthResponse = {
  status: string;
  service: string;
};

function App() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'down'>(
    'checking',
  );

  useEffect(() => {
    fetch('/health')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: HealthResponse) => {
        setApiStatus(data.status === 'ok' ? 'ok' : 'down');
      })
      .catch(() => setApiStatus('down'));
  }, []);

  return (
    <div className="page">
      <header>
        <p className="eyebrow">Cybersecurity risk assessment</p>
        <h1>CyberShield</h1>
        <p className="lede">
          A guided questionnaire for SMEs to assess cyber risk across access
          control, backups, network devices, awareness, and incident response.
        </p>
      </header>

      <main>
        <section aria-labelledby="status-heading">
          <h2 id="status-heading">Local environment</h2>
          <p>
            API status:{' '}
            <strong>
              {apiStatus === 'checking' && 'checking…'}
              {apiStatus === 'ok' && 'connected'}
              {apiStatus === 'down' && 'unavailable'}
            </strong>
          </p>
          <p>
            Login, questionnaire, scoring, and PDF reports land in later
            phases. Use <code>docker compose up</code> to run the stack.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
