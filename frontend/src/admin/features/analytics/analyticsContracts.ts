import { z } from 'zod';

const DimensionSchema = z.object({
  key: z.string(),
  views: z.number(),
  visitors: z.number(),
});

const GeoSchema = z.object({
  country: z.string(),
  region: z.string(),
  city: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  visitors: z.number(),
  views: z.number(),
});

export const AnalyticsOverviewSchema = z.object({
  range: z.object({ from: z.string(), to: z.string(), timezone: z.string() }),
  collection: z.object({
    enabled: z.boolean(), require_consent: z.boolean(),
    raw_retention_days: z.number(), aggregate_retention_days: z.number(),
    full_events: z.number(), limited_events: z.number(),
  }),
  kpis: z.object({
    visitors: z.number(), sessions: z.number(), page_views: z.number(), cta_clicks: z.number(),
    new_visitors: z.number(), returning_visitors: z.number(), cta_conversion: z.number(),
    deltas: z.object({
      visitors: z.number().nullable(), sessions: z.number().nullable(),
      page_views: z.number().nullable(), cta_clicks: z.number().nullable(),
    }),
  }),
  trend: z.array(z.object({
    date: z.string(), visitors: z.number(), sessions: z.number(),
    page_views: z.number(), cta_clicks: z.number(),
  })),
  top_pages: z.array(DimensionSchema), top_sections: z.array(DimensionSchema),
  top_articles: z.array(DimensionSchema), top_treatments: z.array(DimensionSchema),
  top_offers: z.array(DimensionSchema), top_clinics: z.array(DimensionSchema),
  contact_ctas: z.array(DimensionSchema), referrers: z.array(DimensionSchema),
  devices: z.array(DimensionSchema), browsers: z.array(DimensionSchema),
  operating_systems: z.array(DimensionSchema), ip_addresses: z.array(DimensionSchema),
  internet_providers: z.array(DimensionSchema), timezones: z.array(DimensionSchema),
  user_agents: z.array(DimensionSchema), geography: z.array(GeoSchema),
});

export type AnalyticsOverview = z.infer<typeof AnalyticsOverviewSchema>;
export type AnalyticsDimension = z.infer<typeof DimensionSchema>;
