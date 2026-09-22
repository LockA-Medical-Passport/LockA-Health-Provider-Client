export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '');

export class HttpError extends Error {
  readonly status: number | null;
  readonly details: unknown;

  constructor(message: string, status: number | null = null, details?: unknown, cause?: unknown) {
    super(message, { cause });
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export type JsonRequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

function errorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const payload = data as { message?: unknown; error?: unknown };
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    if (payload.error && typeof payload.error === 'object') return errorMessage(payload.error, fallback);
  }
  return fallback;
}

/** JSON requests under the configured API prefix. Use http<void> for empty responses. */
export async function http<T = unknown>(path: string, { body, headers: inputHeaders, ...options }: JsonRequestOptions = {}): Promise<T> {
  const headers = new Headers(inputHeaders);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  try {
    const response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`, {
      ...options,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data: unknown;
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch (cause) {
        if (response.ok) throw new HttpError('The server returned an invalid JSON response.', response.status, undefined, cause);
      }
    }
    if (!response.ok) {
      throw new HttpError(errorMessage(data, `Request failed (${response.status}). Please try again.`), response.status, data);
    }
    return data as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (options.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new HttpError('Request cancelled.', null, undefined, error);
    }
    throw new HttpError('Unable to reach the server. Please try again.', null, undefined, error);
  }
}
