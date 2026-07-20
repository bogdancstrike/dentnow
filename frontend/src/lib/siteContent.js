/** Selectors for business content published by the Admin API. */

export function siteLink(links = [], kind, label) {
  const normalizedLabel = label?.toLocaleLowerCase('ro-RO');
  return links.find((link) => (
    link.kind === kind
    && (!normalizedLabel || link.label?.toLocaleLowerCase('ro-RO') === normalizedLabel)
  )) || null;
}

export function siteLinkHref(link) {
  return link?.url || link?.value || '';
}

export function navigationHref(item) {
  return item?.target_path || item?.external_url || '';
}

export function isExternalHref(href) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href);
}
