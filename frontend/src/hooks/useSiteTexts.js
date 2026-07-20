import { useCallback } from 'react';
import { useOptionalSiteData } from '../public-site/SiteDataProvider';

function formatText(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (
    params[name] === undefined || params[name] === null ? match : String(params[name])
  ));
}

/**
 * Returns `t(key, params?)` from the published Admin text collection.
 * `{token}` placeholders are replaced from `params`.
 */
export function useSiteTexts() {
  const texts = useOptionalSiteData()?.texts;
  return useCallback(
    (key, params) => formatText((texts && texts[key]) ?? '', params),
    [texts],
  );
}
