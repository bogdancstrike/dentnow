import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../msw/server';
import {
  AdminClient,
  VersionConflictError,
  UnauthorizedError,
  AdminApiError,
} from '../../src/admin/api/adminClient';
import { loadRuntimeConfig, __resetRuntimeConfigForTests } from '../../src/config/runtime';

const getToken = async () => 'test-token-123';

beforeEach(async () => {
  __resetRuntimeConfigForTests();
  await loadRuntimeConfig();
});

describe('AdminClient', () => {
  it('attaches bearer token and correlation id, returns data + ETag', async () => {
    let seenAuth: string | null = null;
    let seenCid: string | null = null;
    server.use(
      http.get('/api/v1/admin/clinics/x', ({ request }) => {
        seenAuth = request.headers.get('Authorization');
        seenCid = request.headers.get('X-Correlation-Id');
        return HttpResponse.json({ id: 'x', version: 1 }, { headers: { ETag: '"1"' } });
      }),
    );
    const { data, etag } = await new AdminClient(getToken).get<{ id: string }>('/v1/admin/clinics/x');
    expect(seenAuth).toBe('Bearer test-token-123');
    expect(seenCid).toBeTruthy();
    expect(data.id).toBe('x');
    expect(etag).toBe('"1"');
  });

  it('sends If-Match on patch', async () => {
    let ifMatch: string | null = null;
    server.use(
      http.patch('/api/v1/admin/clinics/x', ({ request }) => {
        ifMatch = request.headers.get('If-Match');
        return HttpResponse.json({ id: 'x', version: 2 }, { headers: { ETag: '"2"' } });
      }),
    );
    await new AdminClient(getToken).patch('/v1/admin/clinics/x', { name: 'Y' }, '"1"');
    expect(ifMatch).toBe('"1"');
  });

  it('maps 409 to a typed VersionConflictError with current representation', async () => {
    server.use(
      http.patch('/api/v1/admin/clinics/x', () =>
        HttpResponse.json(
          { error: 'conflict', message: 'stale', details: { current: { version: 5 } } },
          { status: 409 },
        ),
      ),
    );
    await expect(
      new AdminClient(getToken).patch('/v1/admin/clinics/x', {}, '"1"'),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });

  it('keeps a unique-field 409 as a domain conflict instead of a version conflict', async () => {
    server.use(
      http.patch('/api/v1/admin/doctors/x', () =>
        HttpResponse.json(
          { error: 'conflict', message: 'doctor slug already in use', details: { field: 'slug' } },
          { status: 409 },
        ),
      ),
    );

    try {
      await new AdminClient(getToken).patch('/v1/admin/doctors/x', {}, '"1"');
      throw new Error('request should have failed');
    } catch (error) {
      expect(error).toBeInstanceOf(AdminApiError);
      expect(error).not.toBeInstanceOf(VersionConflictError);
      expect(error).toMatchObject({ status: 409, name: 'AdminApiError' });
    }
  });

  it('maps 401 to UnauthorizedError and other errors to AdminApiError', async () => {
    server.use(http.get('/api/v1/admin/me', () => new HttpResponse(null, { status: 401 })));
    await expect(new AdminClient(getToken).get('/v1/admin/me')).rejects.toBeInstanceOf(UnauthorizedError);

    server.use(http.get('/api/v1/admin/pages', () => new HttpResponse(null, { status: 500 })));
    await expect(new AdminClient(getToken).get('/v1/admin/pages')).rejects.toBeInstanceOf(AdminApiError);
  });
});
