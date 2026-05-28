import fetch, { Blob, FormData } from 'node-fetch';
import { env } from '#config/env.ts';

export type TranscriptionResult = {
  text: string;
  raw: unknown;
};

const requireWhisperKey = (): string => {
  if (!env.WHISPER_API_KEY && !env.OPENAI_API_KEY) {
    throw new Error('WHISPER_API_KEY or OPENAI_API_KEY is required');
  }

  return env.WHISPER_API_KEY || env.OPENAI_API_KEY || '';
};

export const transcribeAudioBuffer = async (params: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  prompt?: string;
  language?: string;
}): Promise<TranscriptionResult> => {
  const apiKey = requireWhisperKey();
  const model = env.STT_MODEL || 'whisper-1';

  const form = new FormData();
  const audioBytes = new Uint8Array(params.buffer.length);
  audioBytes.set(params.buffer);
  const blob = new Blob([audioBytes.buffer as ArrayBuffer], {
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
    'https://api.openai.com/v1/audio/transcriptions',
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
    throw new Error(`Whisper transcription failed: ${errorText}`);
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) {
    throw new Error('Whisper transcription missing text');
  }

  return { text: data.text, raw: data };
};
