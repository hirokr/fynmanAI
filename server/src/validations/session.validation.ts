import z from 'zod';

const SessionResourceContextSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  parsedText: z.string().optional(),
});

export const StartSessionSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  goal: z.string().optional(),
  resourceIds: z.array(z.string().uuid()).optional(),
  resources: z.array(SessionResourceContextSchema).optional(),
});

export const AppendTranscriptSchema = z.object({
  text: z.string().min(1, 'Transcript text is required'),
  startTimeMs: z.number().int().optional(),
  endTimeMs: z.number().int().optional(),
});

export const GenerateEvaluationSchema = z.object({
  type: z.enum(['ROLLING', 'FINAL']).default('FINAL'),
});
