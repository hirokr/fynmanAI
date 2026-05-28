import prisma from '#src/config/database.ts';

export type CreateResourceInput = {
  userId: string;
  title: string;
  sourceType: 'TEXT' | 'UPLOAD' | 'URL';
  mimeType?: string;
  sourceUrl?: string;
  storageKey?: string;
  subject?: string;
  topic?: string;
  metadata?: Record<string, unknown> | null;
};

type ResourceStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export const createResource = async (data: CreateResourceInput) => {
  return prisma.resource.create({
    data: {
      userId: data.userId,
      title: data.title,
      sourceType: data.sourceType,
      mimeType: data.mimeType,
      sourceUrl: data.sourceUrl,
      storageKey: data.storageKey,
      subject: data.subject,
      topic: data.topic,
      metadata: data.metadata ?? undefined,
    },
  });
};

export const updateResourceStatus = async (
  resourceId: string,
  status: ResourceStatus
) =>
  prisma.resource.update({
    where: { id: resourceId },
    data: { status },
  });

export const getResourceById = async (resourceId: string) =>
  prisma.resource.findUnique({
    where: { id: resourceId },
    include: { chunks: true },
  });

export const attachResourceToSession = async (
  sessionId: string,
  resourceIds: string[]
) => {
  const uniqueResourceIds = Array.from(new Set(resourceIds));
  if (!uniqueResourceIds.length) {
    return;
  }

  await prisma.sessionResource.createMany({
    data: uniqueResourceIds.map(resourceId => ({
      sessionId,
      resourceId,
    })),
    skipDuplicates: true,
  });
};

export const createResourceChunk = async (params: {
  id: string;
  resourceId: string;
  chunkIndex: number;
  text: string;
  embeddingModel?: string;
  vectorId?: string;
  metadata?: Record<string, unknown> | null;
}) =>
  prisma.resourceChunk.create({
    data: {
      id: params.id,
      resourceId: params.resourceId,
      chunkIndex: params.chunkIndex,
      text: params.text,
      embeddingModel: params.embeddingModel,
      vectorId: params.vectorId,
      metadata: params.metadata ?? undefined,
    },
  });
