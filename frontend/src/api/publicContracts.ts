/**
 * Public API contracts (mirror of the backend `SiteSnapshotV1` public surface).
 *
 * These are the ONLY shapes the public site renders. No clinic/business content is
 * compiled into the app — it all arrives from `/api/v1/public/*`.
 */
import { z } from 'zod';

export const ContactSchema = z.object({
  kind: z.string(),
  display_value: z.string(),
  normalized_value: z.string().optional(),
  url: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  is_primary: z.boolean().optional(),
});

export const HoursSchema = z.object({
  weekday: z.number(),
  opens_at: z.string().nullable(),
  closes_at: z.string().nullable(),
  closed: z.boolean(),
});

export const ClinicSchema = z.object({
  slug: z.string(),
  name: z.string(),
  area: z.string().nullable().optional(),
  address_full: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  map_embed_url: z.string().nullable().optional(),
  map_link_url: z.string().nullable().optional(),
  contacts: z.array(ContactSchema).default([]),
  hours: z.array(HoursSchema).default([]),
});

export const LinkSchema = z.object({
  kind: z.string(),
  label: z.string(),
  value: z.string(),
  display_value: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

export const NavItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z.object({
    label: z.string(),
    target_path: z.string().nullable().optional(),
    external_url: z.string().nullable().optional(),
    children: z.array(NavItemSchema).default([]),
  }),
);

export interface NavItem {
  label: string;
  target_path?: string | null;
  external_url?: string | null;
  children: NavItem[];
}

export const BootstrapSchema = z.object({
  release_version: z.number(),
  site: z.object({
    site_name: z.string(),
    default_locale: z.string(),
    default_timezone: z.string(),
  }),
  links: z.array(LinkSchema).default([]),
  navigation: z.record(z.string(), z.array(NavItemSchema)).default({}),
  clinics: z.array(ClinicSchema).default([]),
});

export const SectionSchema = z.object({
  block_type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  position: z.number().default(0),
});

export const PageSchema = z.object({
  path: z.string(),
  route_key: z.string(),
  template_key: z.string(),
  title: z.string(),
  indexable: z.boolean().default(true),
  sections: z.array(SectionSchema).default([]),
  seo: z
    .object({
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      canonical_path: z.string().nullable().optional(),
      og_media_id: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const ArticleSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable().optional(),
  cover_media_id: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
});

export type Bootstrap = z.infer<typeof BootstrapSchema>;
export type Clinic = z.infer<typeof ClinicSchema>;
export type Page = z.infer<typeof PageSchema>;
export type ArticleSummary = z.infer<typeof ArticleSummarySchema>;
