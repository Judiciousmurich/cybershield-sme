import { Router } from 'express';
import {
  completeAssessment,
  countResponses,
  createAssessment,
  getAssessmentForUser,
  getCurrentAssessment,
  listResponses,
  upsertResponse,
} from '../db/assessments.js';
import { countActiveQuestions, findQuestionById } from '../db/questions.js';
import { findUserById } from '../db/users.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { buildReportPdf } from '../reports/pdf.js';
import { persistReport } from '../reports/store.js';
import { calculateAndStoreResults } from '../scoring/results.js';
import { toPublicUser } from '../auth/service.js';
import { isAssessmentId, validateAnswerValue } from '../validation/answers.js';
import { parseBody, responseBodySchema } from '../validation/http.js';

export const assessmentsRouter = Router();

assessmentsRouter.use(requireAuth);

assessmentsRouter.post('/', async (req, res, next) => {
  try {
    const existing = await getCurrentAssessment(req.user!.id);
    if (existing) {
      res.json({ assessment: existing });
      return;
    }

    const assessment = await createAssessment(req.user!.id);
    res.status(201).json({ assessment });
  } catch (error) {
    next(error);
  }
});

assessmentsRouter.get('/current', async (req, res, next) => {
  try {
    const assessment = await getCurrentAssessment(req.user!.id);
    if (!assessment) {
      res.status(404).json({ error: 'No assessment in progress.' });
      return;
    }
    const responses = await listResponses(assessment.id);
    res.json({ assessment, responses });
  } catch (error) {
    next(error);
  }
});

assessmentsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!isAssessmentId(req.params.id)) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const assessment = await getAssessmentForUser(req.params.id, req.user!.id);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const responses = await listResponses(assessment.id);
    res.json({ assessment, responses });
  } catch (error) {
    next(error);
  }
});

assessmentsRouter.post('/:id/responses', async (req, res, next) => {
  try {
    if (!isAssessmentId(req.params.id)) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const assessment = await getAssessmentForUser(req.params.id, req.user!.id);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    if (assessment.status === 'completed') {
      res.status(400).json({ error: 'This assessment is already completed.' });
      return;
    }

    const parsed = parseBody(responseBodySchema, req.body);
    if (!parsed.ok) {
      res.status(400).json({ error: parsed.error });
      return;
    }
    const questionId = parsed.data.question_id;

    const question = await findQuestionById(questionId);
    if (!question) {
      res.status(400).json({ error: 'Question not found.' });
      return;
    }

    const invalid = validateAnswerValue(question, parsed.data.answer_value);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    const response = await upsertResponse(
      assessment.id,
      question.id,
      parsed.data.answer_value,
    );
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

assessmentsRouter.post('/:id/complete', async (req, res, next) => {
  try {
    if (!isAssessmentId(req.params.id)) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const assessment = await getAssessmentForUser(req.params.id, req.user!.id);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    if (assessment.status === 'completed') {
      res.json({ assessment });
      return;
    }

    const [answered, required] = await Promise.all([
      countResponses(assessment.id),
      countActiveQuestions(),
    ]);

    if (answered < required) {
      res.status(400).json({
        error: `Answer all questions before completing (${answered} of ${required} answered).`,
      });
      return;
    }

    const completed = await completeAssessment(assessment.id, req.user!.id);
    const results = await calculateAndStoreResults(assessment.id);
    res.json({ assessment: completed ?? assessment, results });
  } catch (error) {
    next(error);
  }
});

assessmentsRouter.get('/:id/results', async (req, res, next) => {
  try {
    if (!isAssessmentId(req.params.id)) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const assessment = await getAssessmentForUser(req.params.id, req.user!.id);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    if (assessment.status !== 'completed') {
      res.status(400).json({
        error: 'Complete the assessment before viewing results.',
      });
      return;
    }

    const results = await calculateAndStoreResults(assessment.id);
    res.json({ assessment, results });
  } catch (error) {
    next(error);
  }
});

assessmentsRouter.get('/:id/report', async (req, res, next) => {
  try {
    if (!isAssessmentId(req.params.id)) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const assessment = await getAssessmentForUser(req.params.id, req.user!.id);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    if (assessment.status !== 'completed') {
      res.status(400).json({
        error: 'Complete the assessment before downloading a report.',
      });
      return;
    }

    const user = await findUserById(req.user!.id);
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }

    const results = await calculateAndStoreResults(assessment.id);
    const pdf = await buildReportPdf(toPublicUser(user), results);
    await persistReport(assessment.id, pdf);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cybershield-report-${assessment.id}.pdf"`,
    );
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});
