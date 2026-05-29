type SessionStartPayload = {
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
};

export const startSession = (socket: any, payload: SessionStartPayload = {}) =>
  new Promise<any>((resolve, reject) => {
    socket.emit("session:start", payload, (res: any) => {
      if (res.ok) resolve(res.session);
      else reject(res.error);
    });
  });

export const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });

type AudioChunkOptions = {
  fileName?: string;
  mimeType?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  endMessage?: string;
};

export const sendAudioChunk = async (
  socket: any,
  sessionId: string,
  blob: Blob,
  options: AudioChunkOptions = {}
) => {
  const base64 = await blobToBase64(blob);

  socket.emit("audio:chunk", {
    sessionId,
    audioBase64: base64,
    fileName: options.fileName || `chunk-${Date.now()}.webm`,
    mimeType: options.mimeType || blob.type || "audio/webm",
    startTimeMs: options.startTimeMs,
    endTimeMs: options.endTimeMs,
    endMessage: options.endMessage,
  });
};

export const sendTextInput = (
  socket: any,
  sessionId: string,
  text: string
) => {
  socket.emit("text:input", {
    sessionId,
    text,
  });
};