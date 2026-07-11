import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadRuntimeConfig,
  getRuntimeConfig,
  requireAdminConfig,
  MissingAdminConfigError,
  RuntimeConfigError,
  __resetRuntimeConfigForTests,
} from '../src/config/runtime';

/** Build a fetch stub returning a real Response with the given body/status. */
function fetchReturning(body: string, init?: ResponseInit): typeof fetch {
  return (async () =>
    new Response(body, { status: 200, ...init })) as unknown as typeof fetch;
}

function fetchJson(obj: unknown): typeof fetch {
  return fetchReturning(JSON.stringify(obj));
}

beforeEach(() => {
  __resetRuntimeConfigForTests();
});

describe('runtime configuration loader', () => {
  it('loads a relative api base and normalizes trailing slashes', async () => {
    const cfg = await loadRuntimeConfig(fetchJson({ apiBase: '/api/' }));
    expect(cfg.apiBase).toBe('/api');
    expect(getRuntimeConfig().apiBase).toBe('/api');
  });

  it('accepts explicit preview and keycloak coordinates', async () => {
    const cfg = await loadRuntimeConfig(
      fetchJson({
        apiBase: '/api',
        previewAppUrl: 'https://preview.dentnow.example/',
        keycloakUrl: 'https://keycloak.doncik.ro/',
        keycloakRealm: 'doncik',
        keycloakClientId: 'dentnow-admin-spa',
      }),
    );
    expect(cfg.previewAppUrl).toBe('https://preview.dentnow.example');
    expect(cfg.keycloakUrl).toBe('https://keycloak.doncik.ro');
    expect(requireAdminConfig(cfg).keycloakRealm).toBe('doncik');
  });

  it('public startup needs only apiBase and does not require keycloak', async () => {
    const cfg = await loadRuntimeConfig(fetchJson({ apiBase: '/api' }));
    expect(cfg.apiBase).toBe('/api');
    expect(cfg.keycloakUrl).toBeUndefined();
    expect(cfg.keycloakClientId).toBeUndefined();
  });

  it('preserves quotes, newlines, and </script> in string values', async () => {
    const weird = 'line1\nline2 "quoted" </script>   ';
    const cfg = await loadRuntimeConfig(
      fetchJson({ apiBase: '/api', buildRevision: weird }),
    );
    expect(cfg.buildRevision).toBe(weird);
  });

  it('rejects malformed JSON without falling back to defaults', async () => {
    await expect(
      loadRuntimeConfig(fetchReturning('{ not json')),
    ).rejects.toBeInstanceOf(RuntimeConfigError);
    expect(() => getRuntimeConfig()).toThrow(RuntimeConfigError);
  });

  it('rejects a non-2xx config response', async () => {
    await expect(
      loadRuntimeConfig(fetchReturning('{}', { status: 503 })),
    ).rejects.toBeInstanceOf(RuntimeConfigError);
  });

  it('rejects unknown extra keys (strict schema)', async () => {
    await expect(
      loadRuntimeConfig(fetchJson({ apiBase: '/api', evil: true })),
    ).rejects.toBeInstanceOf(RuntimeConfigError);
  });

  it('rejects a wrong realm literal', async () => {
    await expect(
      loadRuntimeConfig(fetchJson({ apiBase: '/api', keycloakRealm: 'master' })),
    ).rejects.toBeInstanceOf(RuntimeConfigError);
  });

  it('requireAdminConfig throws and lists every missing admin coordinate', async () => {
    const cfg = await loadRuntimeConfig(fetchJson({ apiBase: '/api' }));
    try {
      requireAdminConfig(cfg);
      expect.unreachable('expected MissingAdminConfigError');
    } catch (err) {
      expect(err).toBeInstanceOf(MissingAdminConfigError);
      const missing = (err as MissingAdminConfigError).missing;
      expect(missing).toContain('previewAppUrl');
      expect(missing).toContain('keycloakUrl');
      expect(missing).toContain('keycloakRealm');
      expect(missing).toContain('keycloakClientId');
    }
  });
});
