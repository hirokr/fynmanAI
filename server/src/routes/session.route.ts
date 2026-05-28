import { Router } from 'express';
import {
  appendTranscriptHandler,
  endSessionHandler,
  requestFinalEvaluationHandler,
  requestRealtimeFeedbackHandler,
  startSessionHandler,
} from '#src/controllers/session.controller.ts';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import {
  AppendTranscriptSchema,
  GenerateEvaluationSchema,
  StartSessionSchema,
} from '#src/validations/session.validation.ts';

const router = Router();
router.use(authMiddleware);

router.post('/', validateRequest(StartSessionSchema), startSessionHandler);
router.post(
  '/:sessionId/transcript',
  validateRequest(AppendTranscriptSchema),
  appendTranscriptHandler
);
router.post('/:sessionId/feedback', requestRealtimeFeedbackHandler);
router.post(
  '/:sessionId/evaluation',
  validateRequest(GenerateEvaluationSchema),
  requestFinalEvaluationHandler
);
router.post('/:sessionId/end', endSessionHandler);

export default router;
