import { Router } from 'express';
import {
  createResourceHandler,
  getResourceHandler,
} from '#src/controllers/resource.controller.ts';
import {
  authMiddleware,
  validateRequest,
} from '#src/middlewares/authenticate.middleware.ts';
import { CreateResourceSchema } from '#src/validations/resource.validation.ts';

const router = Router();
router.use(authMiddleware);

router.post('/', validateRequest(CreateResourceSchema), createResourceHandler);
router.get('/:resourceId', getResourceHandler);

export default router;
