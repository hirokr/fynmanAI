import { generateEmbedding } from '#src/services/ai/ai.service.ts';
import {
  buildResourceFilter,
  getQdrantCollection,
  searchPoints,
} from '#src/services/qdrant.service.ts';

export const retrieveContext = async (params: {
  transcript: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  limit?: number;
}): Promise<string[]> => {
  if (!params.transcript.trim()) {
    return [];
  }

  const embedding = await generateEmbedding(params.transcript);
  const filter = buildResourceFilter({
    resourceIds: params.resourceIds,
    subject: params.subject,
    topic: params.topic,
  });

  const matches = await searchPoints({
    collectionName: getQdrantCollection(),
    vector: embedding.embedding,
    limit: params.limit || 5,
    filter,
  });

  return matches
    .map(match => match.payload?.text)
    .filter((text): text is string => typeof text === 'string');
};
