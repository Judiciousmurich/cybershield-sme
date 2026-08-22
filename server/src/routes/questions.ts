import { Router } from 'express';
import { listActiveQuestions } from '../db/questions.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { DOMAIN_LABELS, DOMAIN_ORDER } from '../types.js';

export const questionsRouter = Router();

questionsRouter.get('/', requireAuth, async (_req, res, next) => {
  try {
    const questions = await listActiveQuestions();
    const domains = DOMAIN_ORDER.map((domain) => ({
      id: domain,
      label: DOMAIN_LABELS[domain],
      questions: questions
        .filter((question) => question.domain === domain)
        .map((question) => ({
          id: question.id,
          domain: question.domain,
          text: question.text,
          weight: question.weight,
          answer_type: question.answer_type,
          options: question.options,
        })),
    }));

    res.json({ domains });
  } catch (error) {
    next(error);
  }
});
