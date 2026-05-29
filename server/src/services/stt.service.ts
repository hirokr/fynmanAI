import fetch, { Blob, FormData } from 'node-fetch';
import { env } from '#config/env.ts';

export type TranscriptionResult = {
  text: string;
  raw: unknown;
};

const requireGroqKey = (): string => {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required');
  }

  return env.GROQ_API_KEY;
};

export const transcribeAudioBuffer = async (params: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  prompt?: string;
  language?: string;
}): Promise<TranscriptionResult> => {
  const apiKey = requireGroqKey();

  // Groq Whisper model
  const model = env.STT_MODEL || 'whisper-large-v3-turbo';

  const form = new FormData();

  const blob = new Blob([params.buffer], {
    type: params.mimeType || 'audio/webm',
  });

  form.append('file', blob, params.fileName);
  form.append('model', model);

  if (params.prompt) {
    form.append('prompt', params.prompt);
  }

  if (params.language) {
    form.append('language', params.language);
  }

  const response = await fetch(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Groq transcription failed: ${errorText}`
    );
  }

  const data = (await response.json()) as {
    text?: string;
  };

  console.log('Groq transcription response:', data);
  if (!data.text) {
    throw new Error('Groq transcription missing text');
  }

  return {
    text: data.text,
    raw: data,
  };
};