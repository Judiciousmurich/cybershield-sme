CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TYPE assessment_status AS ENUM ('in_progress', 'completed');

CREATE TYPE question_domain AS ENUM (
  'access_control',
  'data_backup',
  'network_device_security',
  'security_awareness',
  'incident_response_readiness'
);

CREATE TYPE answer_type AS ENUM ('yes_no', 'scale', 'multiple_choice');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status assessment_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain question_domain NOT NULL,
  text TEXT NOT NULL,
  weight NUMERIC(6, 2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  answer_type answer_type NOT NULL,
  options JSONB,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions (id) ON DELETE RESTRICT,
  answer_value TEXT NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT responses_assessment_question_unique UNIQUE (assessment_id, question_id)
);

CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  domain question_domain NOT NULL,
  score NUMERIC(6, 2) NOT NULL,
  max_score NUMERIC(6, 2) NOT NULL CHECK (max_score > 0),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT risk_scores_assessment_domain_unique UNIQUE (assessment_id, domain)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  file_path_or_blob TEXT
);

CREATE INDEX idx_assessments_user_id ON assessments (user_id);
CREATE INDEX idx_assessments_status ON assessments (status);
CREATE INDEX idx_questions_domain ON questions (domain);
CREATE INDEX idx_questions_active ON questions (active);
CREATE INDEX idx_responses_assessment_id ON responses (assessment_id);
CREATE INDEX idx_responses_question_id ON responses (question_id);
CREATE INDEX idx_risk_scores_assessment_id ON risk_scores (assessment_id);
CREATE INDEX idx_reports_assessment_id ON reports (assessment_id);
