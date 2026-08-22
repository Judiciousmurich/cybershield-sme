import type { Request, Response, NextFunction } from 'express';
import { z, type ZodType } from 'zod';

export const uuidSchema = z.string().uuid();

export const authBodySchema = z.object({
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Za-z]/, 'Password must include at least one letter and one number.')
    .regex(/\d/, 'Password must include at least one letter and one number.'),
});

export const businessContextSchema = z.object({
  business_context: z.string().max(500).nullable().optional(),
});

export const responseBodySchema = z.object({
  question_id: uuidSchema,
  answer_value: z.string().trim().min(1).max(100),
});

export const questionWriteSchema = z.object({
  domain: z.enum([
    'access_control',
    'data_backup',
    'network_device_security',
    'security_awareness',
    'incident_response_readiness',
  ]),
  text: z.string().trim().min(8).max(500),
  weight: z.number().positive().max(10),
  answer_type: z.enum(['yes_no', 'scale', 'multiple_choice']),
  options: z.record(z.string(), z.unknown()).nullable().optional(),
  active: z.boolean().optional(),
});

export const questionUpdateSchema = questionWriteSchema.partial();

export function parseBody<T>(
  schema: ZodType<T>,
  body: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const first = result.error.issues[0];
  return { ok: false, error: first?.message ?? 'Invalid request body.' };
}

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = parseBody(schema, req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    req.body = parsed.data;
    next();
  };
}
