export type PublicUser = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
};

export type QuestionDomain =
  | 'access_control'
  | 'data_backup'
  | 'network_device_security'
  | 'security_awareness'
  | 'incident_response_readiness';

export type AnswerType = 'yes_no' | 'scale' | 'multiple_choice';

export type Question = {
  id: string;
  domain: QuestionDomain;
  text: string;
  weight: number;
  answer_type: AnswerType;
  options: {
    choices?: string[];
    min?: number;
    max?: number;
  } | null;
};

export type DomainGroup = {
  id: QuestionDomain;
  label: string;
  questions: Question[];
};

export type Assessment = {
  id: string;
  user_id: string;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
};

export type SavedResponse = {
  id: string;
  assessment_id: string;
  question_id: string;
  answer_value: string;
  answered_at: string;
};

export type RiskBand = 'Low' | 'Medium' | 'High';

export type AssessmentResults = {
  assessment_id: string;
  overall: {
    score: number;
    risk_band: RiskBand;
    rationale: string;
  };
  domains: {
    domain: QuestionDomain;
    label: string;
    score: number;
    earned: number;
    max_score: number;
    risk_band: RiskBand;
  }[];
  recommendations: {
    domain: QuestionDomain;
    priority: number;
    title: string;
    detail: string;
  }[];
};
