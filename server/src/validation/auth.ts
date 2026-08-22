const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthInput = {
  email: string;
  password: string;
};

export type ValidationFailure = {
  status: 400;
  error: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateAuthInput(
  body: unknown,
): AuthInput | ValidationFailure {
  if (typeof body !== 'object' || body === null) {
    return { status: 400, error: 'Email and password are required.' };
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== 'string' || email.trim() === '') {
    return { status: 400, error: 'A valid email address is required.' };
  }

  const normalised = normalizeEmail(email);
  if (!EMAIL_PATTERN.test(normalised) || normalised.length > 254) {
    return { status: 400, error: 'A valid email address is required.' };
  }

  if (typeof password !== 'string') {
    return { status: 400, error: 'Password is required.' };
  }

  if (password.length < 8) {
    return {
      status: 400,
      error: 'Password must be at least 8 characters.',
    };
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return {
      status: 400,
      error: 'Password must include at least one letter and one number.',
    };
  }

  return { email: normalised, password };
}

export function isValidationFailure(
  value: AuthInput | ValidationFailure,
): value is ValidationFailure {
  return 'status' in value;
}
