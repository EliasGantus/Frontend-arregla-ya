export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorPayload {
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
}

export const normalizeApiError = (
  status: number,
  payload: ErrorPayload | null,
  fallbackMessage: string,
) =>
  new ApiError(
    payload?.message || payload?.error || fallbackMessage,
    status,
    payload?.code,
    payload?.details,
  );
