const { z } = require('zod');
const OfferSchema = z.object({
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

const data = {
  slug: "implant",
  name: "Implant",
  summary: "Desc",
  badge: "Promo",
  price_amount: 1490.0,
  old_amount: 2500.0,
  currency: "RON",
  starts_at: null,
  ends_at: null,
  features: ["A", "B"],
  featured: false,
  position: 0
};

try {
  OfferSchema.parse(data);
  console.log("Success!");
} catch(e) {
  console.log("Error:", e);
}
