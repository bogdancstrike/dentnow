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
  postal_code: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  map_embed_url: z.string().nullable().optional(),
  map_link_url: z.string().nullable().optional(),
  position: z.number().default(0),
  contacts: z.array(ContactSchema).default([]),
  hours: z.array(HoursSchema).default([]),
  transit: z.array(z.object({
    mode: z.string().nullable().optional(),
    label: z.string(),
    detail: z.string().nullable().optional(),
    position: z.number().optional(),
  })).default([]),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    position: z.number().optional(),
  })).default([]),
});

export const GalleryImageSchema = z.object({
  media_id: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  title: z.string(),
  caption: z.string().nullable().optional(),
  alt_text: z.string().nullable().optional(),
  position: z.number().default(0),
});

export const HomepageServiceSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  position: z.number().default(0),
});

export const DoctorSchema = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.string().nullable().optional(),
  focus: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  approach: z.string().nullable().optional(),
  credentials: z.string().nullable().optional(),
  portrait_media_id: z.string().nullable().optional(),
  workspace_media_id: z.string().nullable().optional(),
  secondary_media_id: z.string().nullable().optional(),
  position: z.number().default(0),
});

export const PartnerSchema = z.object({
  name: z.string(),
  relationship_type: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  logo_media_id: z.string().nullable().optional(),
  rights_note: z.string().nullable().optional(),
  link_url: z.string().nullable().optional(),
  position: z.number().default(0),
});

export const QuizSchema = z.object({
  slug: z.string(),
  title: z.string(),
  intro: z.string().nullable().optional(),
  questions: z.array(z.object({
    prompt: z.string(),
    position: z.number().default(0),
    options: z.array(z.object({
      label: z.string(),
      score: z.number().default(0),
      position: z.number().default(0),
    })).default([]),
  })).default([]),
  result_bands: z.array(z.object({
    min_score: z.number(),
    max_score: z.number(),
    title: z.string(),
    description: z.string().nullable().optional(),
    recommendations: z.string().nullable().optional(),
    cta_treatment_id: z.string().nullable().optional(),
  })).default([]),
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

export const TreatmentPriceSchema = z.object({
  price_kind: z.enum(['exact', 'from', 'range', 'on_request']),
  amount: z.number().nullable().optional(),
  amount_max: z.number().nullable().optional(),
  old_amount: z.number().nullable().optional(),
  currency: z.string().default('RON'),
  note: z.string().nullable().optional(),
  clinic_id: z.string().nullable().optional(),
  position: z.number().default(0),
});

export const TreatmentSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category_slug: z.string().nullable().optional(),
  category_label: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  detail_html: z.string().nullable().optional(),
  prices: z.array(TreatmentPriceSchema).default([]),
  homepage_featured: z.boolean().default(false),
  homepage_label: z.string().nullable().optional(),
  homepage_icon: z.string().nullable().optional(),
  position: z.number().default(0),
});

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
  doctors: z.array(DoctorSchema).default([]),
  partners: z.array(PartnerSchema).default([]),
  homepage_services: z.array(HomepageServiceSchema).default([]),
  gallery: z.array(GalleryImageSchema).default([]),
  decontat_cas: z
    .object({
      steps: z.array(z.object({ title: z.string(), text: z.string().nullable().optional(), position: z.number().optional() })).default([]),
      faqs: z.array(z.object({ q: z.string(), a: z.string(), position: z.number().optional() })).default([]),
    })
    .default({ steps: [], faqs: [] }),
  homepage_treatments: z.array(TreatmentSchema).default([]),
  quiz: QuizSchema.nullable().default(null),
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
  position: z.number().default(0),
});
  
export const ReviewSchema = z.object({
  id: z.string().optional(),
  author: z.string(),
  rating: z.number(),
  text_body: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  review_date: z.string(),
});

export const OfferSchema = z.object({
  slug: z.string(),
  name: z.string(),
  summary: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  price_amount: z.number().nullable().optional(),
  old_amount: z.number().nullable().optional(),
  currency: z.string().default('RON'),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  features: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  position: z.number().default(0),
});

export type Bootstrap = z.infer<typeof BootstrapSchema>;
export type Clinic = z.infer<typeof ClinicSchema>;
export type Doctor = z.infer<typeof DoctorSchema>;
export type Partner = z.infer<typeof PartnerSchema>;
export type Page = z.infer<typeof PageSchema>;
export type ArticleSummary = z.infer<typeof ArticleSummarySchema>;
export type Treatment = z.infer<typeof TreatmentSchema>;
export type TreatmentPrice = z.infer<typeof TreatmentPriceSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type Review = z.infer<typeof ReviewSchema>;
