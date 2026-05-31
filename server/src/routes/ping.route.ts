import { Router } from 'express';
import { checkQdrantHealth } from '../services/qdrant.service.ts';

const router = Router();

router.get('/api/ping', async (_req, res) => {
  try {
    const qdrant = await checkQdrantHealth();

    res.status(200).json({
      status: 'ok',
      backend: true,
      qdrant: qdrant.available,
      collection: qdrant.collectionName,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      backend: true,
      qdrant: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;