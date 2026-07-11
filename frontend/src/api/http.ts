/**
 * Minimal HTTP helper for public (unauthenticated) API calls.
 *
 * Resolves request paths against the runtime `apiBase` and surfaces the backend
 * error envelope as a typed {@link ApiError}. The admin client (Task 15) layers
 * bearer tokens, `If-Match`, and 409 handling on top of the same envelope shape.
 */
import { getRuntimeConfig } from '../config/runtime';
import { isApiErrorEnvelope, type ApiErrorEnvelope } from './contracts';

export class ApiError extends Error {
  override name = 'ApiError';
  readonly status: number;
  readonly envelope?: ApiErrorEnvelope;
  readonly correlationId?: string;

  constructor(status: number, envelope?: ApiErrorEnvelope) {
    super(envelope?.message ?? `request failed with status ${status}`);
    this.status = status;
    this.envelope = envelope;
    this.correlationId = envelope?.correlation_id;
  }
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export interface ApiRequestInit extends RequestInit {
  /** Parsed as JSON when the response is ok; otherwise an {@link ApiError} is thrown. */
  signal?: AbortSignal;
}

export async function apiGetJson<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const { apiBase } = getRuntimeConfig();
  const response = await fetch(joinUrl(apiBase, path), {
    method: 'GET',
    headers: { Accept: 'application/json', ...init.headers },
    ...init,
  });

  if (!response.ok) {
    let envelope: ApiErrorEnvelope | undefined;
    try {
      const body: unknown = await response.json();
      if (isApiErrorEnvelope(body)) envelope = body;
    } catch {
      // non-JSON error body; fall through with status only
    }
    throw new ApiError(response.status, envelope);
  }

  return (await response.json()) as T;
}
