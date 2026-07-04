/**
 * Centralized config — pulls from Vite env vars.
 * No hardcoded clinic data anywhere else.
 */

// Program implicit. Poate fi personalizat per clinica (campul `schedule`).
const defaultSchedule = [
  { day: 'Luni – Vineri', hours: '09:00 – 19:00', open: true },
  { day: 'Sâmbătă', hours: '09:00 – 15:00', open: true },
  { day: 'Duminică', hours: '—', open: false },
];

const config = {
  phone: import.meta.env.VITE_PHONE || '+40720509802',
  phoneDisplay: import.meta.env.VITE_PHONE_DISPLAY || '0720 509 802',
  email: import.meta.env.VITE_EMAIL || 'office@dentnow.ro',
  whatsappUrl:
    import.meta.env.VITE_WHATSAPP_URL ||
    'https://wa.me/40720509802?text=Buna%20ziua%2C%20doresc%20o%20programare%20la%20DentNow',
  bookingUrl: import.meta.env.VITE_BOOKING_URL || '',
  leadEndpoint: import.meta.env.VITE_LEAD_ENDPOINT || '',

  // Cele doua linii telefonice — clinicile sunt separate.
  phones: [
    {
      display: '0720 509 802',
      tel: '+40720509802',
      label: 'Dristor & Baba Novac',
      whatsapp: 'https://wa.me/40720509802?text=Buna%20ziua%2C%20doresc%20o%20programare%20la%20DentNow',
    },
    {
      display: '0723 232 263',
      tel: '+40723232263',
      label: 'Prelungirea Ghencea',
      whatsapp: 'https://wa.me/40723232263?text=Buna%20ziua%2C%20doresc%20o%20programare%20la%20DentNow%20Prelungirea%20Ghencea',
    },
  ],
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
      phone: '+40720509802',
      phoneDisplay: '0720 509 802',
      schedule: defaultSchedule,
      mapsLink: 'https://maps.app.goo.gl/XnpRHcXp5RjKuMoc9',
      embedUrl: 'https://maps.google.com/maps?q=DentNow+Strada+Ramnicu+Valcea+29+Bucuresti&z=16&hl=ro&output=embed',
    },
    {
      name: 'DentNow Baba Novac',
      area: 'Dristor / Baba Novac',
      address: 'Str. Dristorului nr. 96, Bl. 12B, sc. B, parter, ap. 47, 031538 București',
      phone: '+40720509802',
      phoneDisplay: '0720 509 802',
      schedule: defaultSchedule,
      mapsLink: 'https://maps.app.goo.gl/1VCnsrxEKDYoUykm6',
      embedUrl: 'https://maps.google.com/maps?q=DentNow+Baba+Novac+Strada+Dristorului+96+Bucuresti&z=16&hl=ro&output=embed',
    },
    {
      name: 'DentNow Prelungirea Ghencea',
      area: 'Prelungirea Ghencea',
      address: 'Prelungirea Ghencea nr. 91F, Bl. 2, demisol, ap. 5, 061715 București',
      phone: '+40723232263',
      phoneDisplay: '0723 232 263',
      schedule: defaultSchedule,
      mapsLink: 'https://maps.app.goo.gl/W9gX6aXMKgV2WbZM8',
      embedUrl: 'https://maps.google.com/maps?q=DentNow+Prelungirea+Ghencea+91F+Bucuresti&z=16&hl=ro&output=embed',
    },
  ],

  social: {
    facebook: import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/dentnow.ro',
    instagram: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/dentnow.ro',
    linkedin: import.meta.env.VITE_LINKEDIN_URL || 'https://www.linkedin.com/company/dentnow-clinic/',
    website: import.meta.env.VITE_WEBSITE_URL || 'https://www.dentnow.ro',
  },
};

export default config;
