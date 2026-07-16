import { useCallback } from 'react';
import { useOptionalSiteData } from '../public-site/SiteDataProvider';
import { SITE_TEXT_FALLBACKS } from '../data/siteTextRegistry';

function formatText(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (
    params[name] === undefined || params[name] === null ? match : String(params[name])
  ));
}

/**
 * Returns `t(key, params?)`: the admin override for `key` when one exists,
 * otherwise the compiled-in fallback from the registry. `{token}` placeholders
 * are replaced from `params`.
 */
export function useSiteTexts() {
  const texts = useOptionalSiteData()?.texts;
  return useCallback(
    (key, params) => formatText((texts && texts[key]) ?? SITE_TEXT_FALLBACKS[key] ?? '', params),
    [texts],
  );
}
