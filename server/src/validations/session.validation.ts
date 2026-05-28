import z from 'zod';

export const StartSessionSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  goal: z.string().optional(),
  resourceIds: z.array(z.string()).optional(),
});

export const AppendTranscriptSchema = z.object({
  text: z.string().min(1, 'Transcript text is required'),
  startTimeMs: z.number().int().optional(),
  endTimeMs: z.number().int().optional(),
});

export const GenerateEvaluationSchema = z.object({
  type: z.enum(['ROLLING', 'FINAL']).default('FINAL'),
});
