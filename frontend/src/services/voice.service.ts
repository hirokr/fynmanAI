export const startSession = (socket: any) => {
  return new Promise<any>((resolve, reject) => {
    socket.emit(
      "session:start",
      {
        subject: "AI",
        topic: "voice practice",
        goal: "improve speaking",
      },
      (res: any) => {
        if (res.ok) resolve(res.session);
        else reject(res.error);
      }
    );
  });
};

export const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });

export const sendAudioChunk = async (
  socket: any,
  sessionId: string,
  blob: Blob
) => {
  const base64 = await blobToBase64(blob);

  socket.emit("audio:chunk", {
    sessionId,
    audioBase64: base64,
    fileName: `chunk-${Date.now()}.webm`,
    mimeType: "audio/webm",
    startTimeMs: Date.now(),
  });
};