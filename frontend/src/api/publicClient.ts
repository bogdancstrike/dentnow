/**
 * Public API client. Requests carry no bearer token. Query keys include the active
 * release version so a page from one publication is never combined with bootstrap
 * from another (on mismatch the caller invalidates and refetches as a unit).
 */
import { apiGetJson } from './http';
import {
  BootstrapSchema,
  PageSchema,
  ArticleSummarySchema,
  TreatmentSchema,
  OfferSchema,
  type Bootstrap,
  type Page,
  type ArticleSummary,
  type Treatment,
  type Offer,
} from './publicContracts';

export async function fetchBootstrap(): Promise<Bootstrap> {
  return BootstrapSchema.parse(await apiGetJson('/v1/public/bootstrap'));
}

export async function fetchPageByPath(path: string): Promise<Page> {
  const data = await apiGetJson<{ page: unknown }>(
    `/v1/public/pages/by-path?path=${encodeURIComponent(path)}`,
  );
  return PageSchema.parse(data.page);
}

export async function fetchArticles(): Promise<ArticleSummary[]> {
  const data = await apiGetJson<{ items: unknown[] }>('/v1/public/articles');
  return data.items.map((item) => ArticleSummarySchema.parse(item));
}

export interface ArticleDetail extends ArticleSummary {
  body_html?: string | null;
}

export async function fetchArticle(slug: string): Promise<ArticleDetail> {
  const data = await apiGetJson<{ article: ArticleDetail }>(
    `/v1/public/articles/${encodeURIComponent(slug)}`,
  );
  return data.article;
}

export async function fetchTreatments(): Promise<Treatment[]> {
  const data = await apiGetJson<{ items: unknown[] }>('/v1/public/treatments');
  return data.items.map((item) => TreatmentSchema.parse(item));
}

export async function fetchOffers(): Promise<Offer[]> {
  const data = await apiGetJson<{ items: unknown[] }>('/v1/public/offers');
  return data.items.map((item) => OfferSchema.parse(item));
}

export const publicQueryKeys = {
  bootstrap: ['public', 'bootstrap'] as const,
  page: (path: string) => ['public', 'page', path] as const,
  articles: ['public', 'articles'] as const,
  article: (slug: string) => ['public', 'article', slug] as const,
  treatments: ['public', 'treatments'] as const,
  offers: ['public', 'offers'] as const,
};
