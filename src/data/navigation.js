export const navLinks = [
  { label: 'Acasa', to: '/' },
  { label: 'Tratamente', to: '/tratamente' },
  { label: 'Oferte', to: '/oferte' },
  { label: 'Recenzii', to: '/recenzii' },
  {
    label: 'Clinica',
    to: '/#clinica',
    children: [
      { label: 'Clinica si galerie', to: '/#clinica' },
      { label: 'Before & After', to: '/before-after' },
      { label: 'Parteneri', to: '/parteneri' },
      { label: 'Contact', to: '/#contact' },
    ],
  },
  {
    label: 'Resurse',
    to: '/articole',
    children: [
      { label: 'Articole', to: '/articole' },
      { label: 'Noutati', to: '/noutati' },
      { label: 'Scor Igiena', to: '/scor-igiena' },
      { label: 'E-bookuri', to: '/ebook' },
    ],
  },
];

export const mobileNavLinks = [
  { label: 'Acasa', to: '/' },
  { label: 'Tratamente si tarife', to: '/tratamente' },
  { label: 'Oferte', to: '/oferte' },
  { label: 'Recenzii', to: '/recenzii' },
  { label: 'Clinica si galerie', to: '/#clinica' },
  { label: 'Before & After', to: '/before-after' },
  { label: 'Articole', to: '/articole' },
  { label: 'Scor Igiena', to: '/scor-igiena' },
  { label: 'Noutati', to: '/noutati' },
  { label: 'Parteneri', to: '/parteneri' },
  { label: 'E-bookuri', to: '/ebook' },
];

export const footerServices = [
  { label: 'Implanturi Dentare', to: '/tratamente#implanturi' },
  { label: 'Igienizare GBT', to: '/tratamente#igienizare' },
  { label: 'Albire Dentara', to: '/tratamente#albire' },
  { label: 'Ortodontie', to: '/tratamente#ortodontie' },
  { label: 'Obturații', to: '/tratamente#obturatii' },
  { label: 'Pedodontie', to: '/tratamente#pediatrie' },
];

export const footerClinic = [
  { label: 'Clinica si galerie', to: '/#clinica' },
  { label: 'Recenzii Pacienti', to: '/recenzii' },
  { label: 'Before & After', to: '/before-after' },
  { label: 'Noutati', to: '/noutati' },
  { label: 'Parteneri', to: '/parteneri' },
  { label: 'E-bookuri', to: '/ebook' },
];
