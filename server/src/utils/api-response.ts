import { Response } from 'express';

type ApiSuccessPayload<T> = {
  success: true;
  message?: string;
  data?: T;
};

type ApiErrorPayload = {
  success: false;
  message: string;
  errors?: unknown;
};

type SendSuccessOptions<T> = {
  status?: number;
  message?: string;
  data?: T;
};

type SendErrorOptions = {
  status?: number;
  message: string;
  errors?: unknown;
};

export const sendApiSuccess = <T>(
  res: Response,
  { status = 200, message, data }: SendSuccessOptions<T> = {}
) => {
  const payload: ApiSuccessPayload<T> = {
    success: true,
  };

  if (message) {
    payload.message = message;
  }

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(status).json(payload);
};

export const sendApiError = (
  res: Response,
  { status = 500, message, errors }: SendErrorOptions
) => {
  const payload: ApiErrorPayload = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    payload.errors = errors;
  }

  return res.status(status).json(payload);
};
