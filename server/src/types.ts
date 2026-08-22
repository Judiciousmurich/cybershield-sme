export type UserRole = 'user' | 'admin';

export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  business_context: string | null;
};

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
  business_context: string | null;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type QuestionDomain =
  | 'access_control'
  | 'data_backup'
  | 'network_device_security'
  | 'security_awareness'
  | 'incident_response_readiness';

export type AnswerType = 'yes_no' | 'scale' | 'multiple_choice';

export type AssessmentStatus = 'in_progress' | 'completed';

export type QuestionRecord = {
  id: string;
  domain: QuestionDomain;
  text: string;
  weight: number;
  answer_type: AnswerType;
  options: Record<string, unknown> | null;
  active: boolean;
};

export type AssessmentRecord = {
  id: string;
  user_id: string;
  status: AssessmentStatus;
  started_at: Date;
  completed_at: Date | null;
};

export type ResponseRecord = {
  id: string;
  assessment_id: string;
  question_id: string;
  answer_value: string;
  answered_at: Date;
};

export const DOMAIN_ORDER: QuestionDomain[] = [
  'access_control',
  'data_backup',
  'network_device_security',
  'security_awareness',
  'incident_response_readiness',
];

export const DOMAIN_LABELS: Record<QuestionDomain, string> = {
  access_control: 'Access control',
  data_backup: 'Data backup',
  network_device_security: 'Network device security',
  security_awareness: 'Security awareness',
  incident_response_readiness: 'Incident response readiness',
};
