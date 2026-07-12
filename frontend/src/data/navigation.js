export const navLinks = [
  { label: 'Acasa', to: '/' },
  { label: 'Decontare CAS', to: '/decontat-cas' },
  {
    label: 'Tratamente',
    to: '/tratamente',
    children: [
      { label: 'Toate tratamentele', to: '/tratamente' },
      { label: 'Implant Dentar București', to: '/implant-dentar-bucuresti' },
      { label: 'Aparat Dentar Dristor', to: '/aparat-dentar-dristor' },
      { label: 'Albire Dentară Laser', to: '/albire-dentara-laser' },
      { label: 'Protetică Zirconiu', to: '/protetica-zirconiu' },
      { label: 'Urgențe Dentare', to: '/urgente-dentare-bucuresti' },
    ],
  },
  { label: 'Oferte', to: '/oferte' },
  {
    label: 'Locații',
    to: '/stomatologie-dristor',
    children: [
      { label: 'Stomatologie Dristor', to: '/stomatologie-dristor' },
      { label: 'Stomatologie Baba Novac', to: '/stomatologie-baba-novac' },
      { label: 'Stomatologie Prelungirea Ghencea', to: '/stomatologie-prelungirea-ghencea' },
    ],
  },
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
  { label: 'Decontare CAS', to: '/decontat-cas' },
  { label: 'Tratamente si tarife', to: '/tratamente' },
  { label: 'Urgențe Dentare București', to: '/urgente-dentare-bucuresti' },
  { label: 'Implant Dentar București', to: '/implant-dentar-bucuresti' },
  { label: 'Oferte', to: '/oferte' },
  { label: 'DentNow Dristor', to: '/stomatologie-dristor' },
  { label: 'DentNow Baba Novac', to: '/stomatologie-baba-novac' },
  { label: 'DentNow Prelungirea Ghencea', to: '/stomatologie-prelungirea-ghencea' },
  { label: 'Before & After', to: '/before-after' },
  { label: 'Articole', to: '/articole' },
  { label: 'Scor Igiena', to: '/scor-igiena' },
];
