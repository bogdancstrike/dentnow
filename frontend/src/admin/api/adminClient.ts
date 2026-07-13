/**
 * Admin API client. Every request carries a fresh bearer token and a correlation id;
 * mutations send `If-Match` and distinguish stale-version conflicts from other 409
 * domain conflicts. Tokens live only in memory — provided by an injected getter so
 * the client is testable without a real Keycloak.
 */
import { getRuntimeConfig } from '../../config/runtime';
import { isApiErrorEnvelope, type ApiErrorEnvelope } from '../../api/contracts';

export class AdminApiError extends Error {
  override name = 'AdminApiError';
  readonly status: number;
  readonly envelope?: ApiErrorEnvelope;
  constructor(status: number, envelope?: ApiErrorEnvelope) {
    super(envelope?.message ?? `admin request failed (${status})`);
    this.status = status;
    this.envelope = envelope;
  }
}

export class VersionConflictError extends AdminApiError {
  override name = 'VersionConflictError';
  readonly current?: unknown;
  constructor(envelope?: ApiErrorEnvelope) {
    super(409, envelope);
    this.current = envelope?.details?.['current'];
  }
}

export class UnauthorizedError extends AdminApiError {
  override name = 'UnauthorizedError';
}

export type TokenGetter = () => Promise<string>;

export interface AdminRequest {
  method?: string;
  body?: unknown;
  ifMatch?: string;
  signal?: AbortSignal;
  correlationId?: string;
}

function uuid(): string {
  // crypto.randomUUID is available in modern browsers and jsdom (node) test env.
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cid-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function isVersionConflict(envelope?: ApiErrorEnvelope): boolean {
  const details = envelope?.details;
  return Boolean(details && ('current' in details || 'current_version' in details));
}

function conflictError(envelope?: ApiErrorEnvelope): AdminApiError {
  return isVersionConflict(envelope)
    ? new VersionConflictError(envelope)
    : new AdminApiError(409, envelope);
}

export class AdminClient {
  constructor(private readonly getToken: TokenGetter) {}

  async request<T>(path: string, init: AdminRequest = {}): Promise<{ data: T; etag: string | null }> {
    const { apiBase } = getRuntimeConfig();
    const token = await this.getToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'X-Correlation-Id': init.correlationId ?? uuid(),
    };
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';
    if (init.ifMatch) headers['If-Match'] = init.ifMatch;

    const response = await fetch(`${apiBase}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
    });

    if (response.status === 204) {
      return { data: undefined as T, etag: response.headers.get('ETag') };
    }

    if (!response.ok) {
      let envelope: ApiErrorEnvelope | undefined;
      try {
        const body: unknown = await response.json();
        if (isApiErrorEnvelope(body)) envelope = body;
      } catch {
        /* non-JSON error body */
      }
      if (response.status === 409) throw conflictError(envelope);
      if (response.status === 401) throw new UnauthorizedError(401, envelope);
      throw new AdminApiError(response.status, envelope);
    }

    const data = (await response.json()) as T;
    return { data, etag: response.headers.get('ETag') };
  }

  get<T>(path: string, signal?: AbortSignal) {
    return this.request<T>(path, { method: 'GET', signal });
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'POST', body });
  }
  patch<T>(path: string, body: unknown, ifMatch: string) {
    return this.request<T>(path, { method: 'PATCH', body, ifMatch });
  }
  del<T>(path: string, ifMatch?: string) {
    return this.request<T>(path, { method: 'DELETE', ifMatch });
  }

  async download(path: string, signal?: AbortSignal): Promise<Blob> {
    const { apiBase } = getRuntimeConfig();
    const token = await this.getToken();
    const response = await fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Correlation-Id': uuid() },
      signal,
    });
    if (!response.ok) throw new AdminApiError(response.status);
    return response.blob();
  }

  /**
   * Multipart upload. The browser sets the `multipart/form-data` boundary itself, so
   * we must NOT force a JSON `Content-Type`. Still carries the bearer token and a
   * correlation id, and surfaces the same typed errors as {@link request}.
   */
  async upload<T>(path: string, form: FormData, signal?: AbortSignal): Promise<{ data: T; etag: string | null }> {
    const { apiBase } = getRuntimeConfig();
    const token = await this.getToken();
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Correlation-Id': uuid(),
      },
      body: form,
      signal,
    });

    if (!response.ok) {
      let envelope: ApiErrorEnvelope | undefined;
      try {
        const body: unknown = await response.json();
        if (isApiErrorEnvelope(body)) envelope = body;
      } catch {
        /* non-JSON error body */
      }
      if (response.status === 409) throw conflictError(envelope);
      if (response.status === 401) throw new UnauthorizedError(401, envelope);
      throw new AdminApiError(response.status, envelope);
    }

    const data = (await response.json()) as T;
    return { data, etag: response.headers.get('ETag') };
  }
}
