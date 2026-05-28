import crypto from 'node:crypto';
import { generateEmbedding } from '#src/services/ai/ai.service.ts';
import {
  createResourceChunk,
  updateResourceStatus,
} from '#src/services/resource.service.ts';
import {
  ensureCollection,
  getQdrantCollection,
  upsertPoints,
} from '#src/services/qdrant.service.ts';

const chunkText = (text: string, size = 1000, overlap = 150): string[] => {
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const end = Math.min(cursor + size, text.length);
    const chunk = text.slice(cursor, end).trim();
    if (chunk.length) {
      chunks.push(chunk);
    }
    cursor = end - overlap;
    if (cursor < 0) {
      cursor = 0;
    }
  }

  return chunks;
};

export const ingestResourceText = async (params: {
  resourceId: string;
  text: string;
  subject?: string;
  topic?: string;
}): Promise<{ chunkCount: number }> => {
  await updateResourceStatus(params.resourceId, 'PROCESSING');

  try {
    const chunks = chunkText(params.text);
    if (!chunks.length) {
      throw new Error('No text content to ingest');
    }

    const collectionName = getQdrantCollection();
    const firstEmbedding = await generateEmbedding(chunks[0]);
    await ensureCollection(collectionName, firstEmbedding.embedding.length);

    const points = [
      {
        id: crypto.randomUUID(),
        vector: firstEmbedding.embedding,
        payload: {
          resourceId: params.resourceId,
          subject: params.subject,
          topic: params.topic,
          chunkIndex: 0,
          text: chunks[0],
        },
      },
    ];

    await upsertPoints(collectionName, points);
    await createResourceChunk({
      id: String(points[0].id),
      resourceId: params.resourceId,
      chunkIndex: 0,
      text: chunks[0],
      embeddingModel: firstEmbedding.model,
      vectorId: String(points[0].id),
      metadata: {
        subject: params.subject,
        topic: params.topic,
      },
    });

    for (let index = 1; index < chunks.length; index += 1) {
      const chunkTextValue = chunks[index];
      const embedding = await generateEmbedding(chunkTextValue);
      const chunkId = crypto.randomUUID();

      await upsertPoints(collectionName, [
        {
          id: chunkId,
          vector: embedding.embedding,
          payload: {
            resourceId: params.resourceId,
            subject: params.subject,
            topic: params.topic,
            chunkIndex: index,
            text: chunkTextValue,
          },
        },
      ]);

      await createResourceChunk({
        id: chunkId,
        resourceId: params.resourceId,
        chunkIndex: index,
        text: chunkTextValue,
        embeddingModel: embedding.model,
        vectorId: chunkId,
        metadata: {
          subject: params.subject,
          topic: params.topic,
        },
      });
    }

    await updateResourceStatus(params.resourceId, 'READY');

    return { chunkCount: chunks.length };
  } catch (error) {
    await updateResourceStatus(params.resourceId, 'FAILED');
    throw error;
  }
};
