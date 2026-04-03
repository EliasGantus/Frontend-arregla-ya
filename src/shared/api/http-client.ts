import { env } from '@/shared/config/env';
import { ApiError, normalizeApiError } from '@/shared/api/api-error';

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: BodyInit | object | null;
  query?: Record<string, QueryValue>;
  retry?: boolean;
}

interface HttpClientRuntimeConfig {
  getAccessToken?: () => string | null;
  refreshAccessToken?: () => Promise<boolean>;
  onUnauthorized?: () => void;
}

let runtimeConfig: HttpClientRuntimeConfig = {};

export const configureHttpClient = (config: HttpClientRuntimeConfig) => {
  runtimeConfig = config;
};

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  const target = new URL(path, env.apiUrl);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        target.searchParams.set(key, String(value));
      }
    });
  }

  return target.toString();
};

const isJsonBody = (body: RequestOptions['body']) =>
  Boolean(body) &&
  !(typeof body === 'string') &&
  !(body instanceof FormData) &&
  !(body instanceof Blob) &&
  !(body instanceof URLSearchParams) &&
  !(body instanceof ArrayBuffer) &&
  !ArrayBuffer.isView(body);

const toRequestBody = (body: RequestOptions['body']): BodyInit | undefined => {
  if (body === null || body === undefined) {
    return undefined;
  }

  if (isJsonBody(body)) {
    return JSON.stringify(body);
  }

  return body as BodyInit;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204) {
    return undefined as T;
  }

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

const createHeaders = (headers: HeadersInit | undefined, body: RequestOptions['body']) => {
  const nextHeaders = new Headers(headers);

  if (isJsonBody(body) && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  nextHeaders.set('Accept', 'application/json');

  return nextHeaders;
};

export const httpClient = {
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { auth = true, body, query, retry = true, headers, ...init } = options;
    const requestHeaders = createHeaders(headers, body);
    const accessToken = auth ? runtimeConfig.getAccessToken?.() : null;

    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }

    let response: Response;

    try {
      response = await fetch(buildUrl(path, query), {
        ...init,
        headers: requestHeaders,
        body: toRequestBody(body),
      });
    } catch (error) {
      throw new ApiError(
        'No pudimos comunicarnos con el backend. Verifica VITE_API_URL o el estado del servidor.',
        0,
        'NETWORK_ERROR',
        error,
      );
    }

    if (response.status === 401 && auth && retry) {
      const refreshed = await runtimeConfig.refreshAccessToken?.();

      if (refreshed) {
        return this.request<T>(path, { ...options, retry: false });
      }

      runtimeConfig.onUnauthorized?.();
    }

    if (!response.ok) {
      let payload: unknown = null;

      try {
        payload = await parseResponse(response);
      } catch {
        payload = null;
      }

      throw normalizeApiError(
        response.status,
        payload as { message?: string; error?: string; code?: string; details?: unknown } | null,
        'Ocurrió un error inesperado.',
      );
    }

    return parseResponse<T>(response);
  },
  get<T>(path: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  },
  patch<T>(path: string, body?: RequestOptions['body'], options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  },
};
