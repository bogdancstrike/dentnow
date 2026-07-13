import { http, HttpResponse } from 'msw';

/**
 * Default deterministic handlers for component/integration tests. Individual specs
 * override these with `server.use(...)`. Public-site and admin contract handlers are
 * expanded in Tasks 14–19.
 */
export const handlers = [
  http.get('/config.json', () =>
    HttpResponse.json({
      apiBase: '/api',
      keycloakUrl: 'http://localhost:8080',
      keycloakRealm: 'doncik',
      keycloakClientId: 'dentnow-admin-spa',
    }),
  ),
];
