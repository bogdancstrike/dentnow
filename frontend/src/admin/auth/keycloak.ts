/**
 * Lazy Keycloak initialization — created ONLY inside the admin bundle, never at public
 * startup. Uses Authorization Code + PKCE (S256) against realm `doncik`. Access/refresh
 * tokens are kept in memory by keycloak-js and are never written to local/session
 * storage. The admin API client refreshes shortly before each request.
 */
import Keycloak from 'keycloak-js';
import { requireAdminConfig } from '../../config/runtime';

let instance: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;

export function getKeycloak(): Keycloak {
  if (instance) return instance;
  const cfg = requireAdminConfig();
  instance = new Keycloak({
    url: cfg.keycloakUrl,
    realm: cfg.keycloakRealm,
    clientId: cfg.keycloakClientId,
  });
  return instance;
}

/** Initialize with login-required; redirects to Keycloak and back to the current URL. */
export function initKeycloak(): Promise<boolean> {
  if (initPromise) return initPromise;
  initPromise = getKeycloak().init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });
  return initPromise;
}

/** Return a valid access token, refreshing if it expires within 30s. */
export async function getAdminToken(): Promise<string> {
  const kc = getKeycloak();
  try {
    await kc.updateToken(30);
  } catch {
    await kc.login();
  }
  if (!kc.token) throw new Error('no admin token');
  return kc.token;
}

export function logout(): void {
  getKeycloak().logout({ redirectUri: window.location.origin + '/' });
}

export function hasRealmRole(role: string): boolean {
  return getKeycloak().hasRealmRole(role);
}

/** Test seam: install a stub Keycloak so the shell can be tested without a server. */
export function __setKeycloakForTests(stub: Keycloak | null): void {
  instance = stub;
  initPromise = stub ? Promise.resolve(true) : null;
}
