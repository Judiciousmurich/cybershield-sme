export type UserRole = 'user' | 'admin';

export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
