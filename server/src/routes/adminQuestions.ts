import { Router } from 'express';
import {
  createQuestion,
  listAllQuestions,
  updateQuestion,
} from '../db/questions.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { isAssessmentId } from '../validation/answers.js';
import {
  questionUpdateSchema,
  questionWriteSchema,
  validateBody,
} from '../validation/http.js';

export const adminQuestionsRouter = Router();

adminQuestionsRouter.use(requireAuth, requireRole('admin'));

adminQuestionsRouter.get('/', async (_req, res, next) => {
  try {
    const questions = await listAllQuestions();
    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

adminQuestionsRouter.post(
  '/',
  validateBody(questionWriteSchema),
  async (req, res, next) => {
    try {
      const question = await createQuestion(req.body);
      res.status(201).json({ question });
    } catch (error) {
      next(error);
    }
  },
);

adminQuestionsRouter.put(
  '/:id',
  validateBody(questionUpdateSchema),
  async (req, res, next) => {
    try {
      if (!isAssessmentId(req.params.id)) {
        res.status(404).json({ error: 'Question not found.' });
        return;
      }
      const question = await updateQuestion(req.params.id, req.body);
      if (!question) {
        res.status(404).json({ error: 'Question not found.' });
        return;
      }
      res.json({ question });
    } catch (error) {
      next(error);
    }
  },
);
