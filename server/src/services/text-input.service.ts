import logger from '#config/logger.ts';

export const handleTextInput = async (params: {
  sessionId: string;
  userId: string;
  text: string;
}) => {
  logger.info(
    `Realtime text input received: session=${params.sessionId} user=${params.userId} length=${params.text.length}`
  );

  return {
    sessionId: params.sessionId,
    userId: params.userId,
    text: params.text,
  };
};
