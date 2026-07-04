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
      'https://maps.google.com/maps?q=44.4136318,26.1408659&z=16&hl=ro&output=embed',
    link: import.meta.env.VITE_MAPS_LINK || 'https://maps.app.goo.gl/N4KTXjfQhuvNNKS58',
  },

  // Cele 3 clinici DentNow din Bucuresti
  locations: [
    {
      name: 'DentNow Dristor',
      area: 'Dristor / Râmnicu Vâlcea',
      address: 'Interfon 01, Str. Râmnicu Vâlcea nr. 29, Bl. 20D, parter, ap. 1, 031806 București',
      mapsLink: 'https://www.google.com/maps/place/DentNow/@44.4136787,26.1409317,127m/data=!3m1!1e3!4m6!3m5!1s0x40b1ff01ae132173:0xb5417b8132c17d71!8m2!3d44.4136318!4d26.1408659!16s%2Fg%2F11s1txk8ql',
      embedUrl: 'https://maps.google.com/maps?q=44.4136318,26.1408659&z=16&hl=ro&output=embed',
    },
    {
      name: 'DentNow Baba Novac',
      area: 'Dristor / Baba Novac',
      address: 'Str. Dristorului nr. 96, Bl. 12B, sc. B, parter, ap. 47, 031538 București',
      mapsLink: 'https://www.google.com/maps/place/%22DentNow+Baba+Novac%22+Clinica+Stomatologica/@44.4228679,26.1354827,1083m/data=!3m2!1e3!4b1!4m6!3m5!1s0x40b1ffc6040ab899:0xc04dc423249a7dc6!8m2!3d44.4228641!4d26.138063!16s%2Fg%2F11z3zzll84',
      embedUrl: 'https://maps.google.com/maps?q=44.4228641,26.138063&z=16&hl=ro&output=embed',
    },
    {
      name: 'DentNow Prelungirea Ghencea',
      area: 'Prelungirea Ghencea',
      address: 'Prelungirea Ghencea nr. 91F, Bl. 2, demisol, ap. 5, 061715 București',
      mapsLink: 'https://www.google.com/maps/place/%22DentNow+Prelungirea+Ghencea%22+Clinica+Stomatologica/@44.4107079,26.0116802,1083m/data=!3m2!1e3!4b1!4m6!3m5!1s0x40b20193758a731b:0x2ddb22cc1ac9dfc5!8m2!3d44.4107041!4d26.0142605!16s%2Fg%2F11z4bv8tgr',
      embedUrl: 'https://maps.google.com/maps?q=44.4107041,26.0142605&z=16&hl=ro&output=embed',
    },
  ],

  social: {
    facebook: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/dentnow',
    instagram: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/dentnow',
    website: import.meta.env.VITE_WEBSITE_URL || 'https://www.dentnow.ro',
  },
};

export default config;
