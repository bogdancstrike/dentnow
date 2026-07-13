/**
 * Public runtime configuration.
 *
 * Loaded once from `/config.json` (rendered by the container at startup with a real
 * JSON serializer, served `no-store`). It contains ONLY infrastructure coordinates —
 * never clinic content, never secrets. Business data comes exclusively from the
 * backend publication API.
 *
 * Public startup requires only `apiBase` and never initializes Keycloak. The admin
 * bundle calls {@link requireAdminConfig} to assert the Keycloak/preview coordinates
 * are present before it loads.
 */
import { z } from 'zod';

const RuntimeConfigSchema = z
  .object({
    apiBase: z.string().min(1, 'apiBase is required'),
    previewAppUrl: z.string().url().optional(),
    keycloakUrl: z.string().url().optional(),
    keycloakRealm: z.literal('doncik').optional(),
    keycloakClientId: z.literal('dentnow-admin-spa').optional(),
    buildRevision: z.string().optional(),
    analyticsEnabled: z.boolean().default(false),
    analyticsRequireConsent: z.boolean().default(true),
  })
  .strict();

export type DentNowRuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

export type AdminRuntimeConfig = DentNowRuntimeConfig &
  Required<
    Pick<
      DentNowRuntimeConfig,
      'previewAppUrl' | 'keycloakUrl' | 'keycloakRealm' | 'keycloakClientId'
    >
  >;

export class RuntimeConfigError extends Error {
  override name = 'RuntimeConfigError';
}

export class MissingAdminConfigError extends Error {
  override name = 'MissingAdminConfigError';
  readonly missing: string[];
  constructor(missing: string[]) {
    super(`missing admin runtime config: ${missing.join(', ')}`);
    this.missing = missing;
  }
}

function stripTrailingSlash(value: string): string {
  const trimmed = value.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

function normalize(config: DentNowRuntimeConfig): DentNowRuntimeConfig {
  return {
    ...config,
    apiBase: stripTrailingSlash(config.apiBase),
    previewAppUrl: config.previewAppUrl
      ? stripTrailingSlash(config.previewAppUrl)
      : undefined,
    keycloakUrl: config.keycloakUrl
      ? stripTrailingSlash(config.keycloakUrl)
      : undefined,
  };
}

let cached: DentNowRuntimeConfig | null = null;

/**
 * Fetch and validate `/config.json`. Throws {@link RuntimeConfigError} on a network
 * failure, non-JSON body, or schema violation. Never falls back to compiled defaults.
 */
export async function loadRuntimeConfig(
  fetchImpl: typeof fetch = fetch,
): Promise<DentNowRuntimeConfig> {
  let response: Response;
  try {
    response = await fetchImpl('/config.json', { cache: 'no-store' });
  } catch (cause) {
    throw new RuntimeConfigError('runtime config request failed', { cause });
  }
  if (!response.ok) {
    throw new RuntimeConfigError(
      `runtime config request returned ${response.status}`,
    );
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (cause) {
    throw new RuntimeConfigError('runtime config is not valid JSON', { cause });
  }

  const parsed = RuntimeConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RuntimeConfigError(
      `runtime config failed validation: ${parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ')}`,
    );
  }

  cached = normalize(parsed.data);
  return cached;
}

/** Return the config loaded by {@link loadRuntimeConfig}; throws if not loaded yet. */
export function getRuntimeConfig(): DentNowRuntimeConfig {
  if (!cached) {
    throw new RuntimeConfigError('runtime config accessed before it was loaded');
  }
  return cached;
}

/**
 * Assert the admin/preview coordinates exist. Called only when the admin bundle is
 * requested (bare `/admin` or `/admin/*`). Throws {@link MissingAdminConfigError}
 * listing every missing field so the shell can render an explicit error instead of a
 * broken login attempt.
 */
export function requireAdminConfig(
  config: DentNowRuntimeConfig = getRuntimeConfig(),
): AdminRuntimeConfig {
  const missing: string[] = [];
  if (!config.previewAppUrl) missing.push('previewAppUrl');
  if (!config.keycloakUrl) missing.push('keycloakUrl');
  if (!config.keycloakRealm) missing.push('keycloakRealm');
  if (!config.keycloakClientId) missing.push('keycloakClientId');
  if (missing.length > 0) {
    throw new MissingAdminConfigError(missing);
  }
  return config as AdminRuntimeConfig;
}

/** Test-only: clear the module-level cache between cases. */
export function __resetRuntimeConfigForTests(): void {
  cached = null;
}
