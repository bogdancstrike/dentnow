/**
 * Shared API contract types used by both the public and admin clients.
 *
 * The backend error envelope is documented in `docs/architecture.md` §12:
 * `{ error, message, details?, correlation_id }`. Concrete public/admin response
 * contracts are added in Tasks 14–19 alongside their query clients.
 */

export interface ApiErrorEnvelope {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  correlation_id?: string;
}

export function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).error === 'string' &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}
