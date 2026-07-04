/**
 * Centralized config — pulls from Vite env vars.
 * No hardcoded clinic data anywhere else.
 */
const config = {
  phone: import.meta.env.VITE_PHONE || '+40720509802',
  phoneDisplay: import.meta.env.VITE_PHONE_DISPLAY || '0720 509 802',
  email: import.meta.env.VITE_EMAIL || 'contact@dentnow.ro',
  whatsappUrl:
    import.meta.env.VITE_WHATSAPP_URL ||
    'https://wa.me/40720509802?text=Buna%20ziua%2C%20doresc%20o%20programare%20la%20DentNow',
  bookingUrl: import.meta.env.VITE_BOOKING_URL || '',
  leadEndpoint: import.meta.env.VITE_LEAD_ENDPOINT || '',
  verifiedReviewsUrl: import.meta.env.VITE_REVIEWS_URL || 'https://maps.app.goo.gl/N4KTXjfQhuvNNKS58',
  contentUpdatedAt: import.meta.env.VITE_CONTENT_UPDATED_AT || '2026-07-04',

  address: {
    street: import.meta.env.VITE_ADDRESS_STREET || 'Str. Râmnicu Vâlcea 29, Bl. 20D',
    detail: import.meta.env.VITE_ADDRESS_DETAIL || 'Parter, Ap. 01 · București',
    full:
      import.meta.env.VITE_ADDRESS_FULL ||
      'Strada Râmnicu Vâlcea nr. 29, Bloc 20D, Parter, Ap. 01, Interfon 01, București, România',
  },

  maps: {
    embedUrl:
      import.meta.env.VITE_MAPS_EMBED_URL ||
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2848.45!2d26.0700!3d44.4300!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b1ff427a68bd05%3A0x7cb5494bf0c9a5da!2sDentNow!5e0!3m2!1sro!2sro!4v1710000000000',
    link: import.meta.env.VITE_MAPS_LINK || 'https://maps.app.goo.gl/N4KTXjfQhuvNNKS58',
  },

  social: {
    facebook: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/dentnow',
    instagram: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/dentnow',
    website: import.meta.env.VITE_WEBSITE_URL || 'https://www.dentnow.ro',
  },
};

export default config;
