import { CAP } from '../auth/permissions';

export interface AdminNavItem {
  slug: string;
  key: string;
  label: string;
  capability?: string;
}

export const ADMIN_NAVIGATION: { group: string; items: AdminNavItem[] }[] = [
  {
    group: 'Clinici & echipă',
    items: [
      { slug: 'clinici', key: 'clinics', label: 'Clinici', capability: CAP.contentRead },
      { slug: 'clinica', key: 'gallery', label: 'Galerie clinică', capability: CAP.contentRead },
      { slug: 'echipa-medicala', key: 'doctors', label: 'Echipă medicală', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { slug: 'tratamente', key: 'treatments', label: 'Tratamente & prețuri', capability: CAP.contentRead },
      { slug: 'servicii-dentnow', key: 'homepage-services', label: 'Servicii (prima pagină)', capability: CAP.contentRead },
      { slug: 'oferte', key: 'offers', label: 'Oferte', capability: CAP.contentRead },
      { slug: 'parteneri', key: 'partners', label: 'Parteneri', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Conținut',
    items: [
      { slug: 'articole', key: 'articles', label: 'Articole', capability: CAP.contentRead },
      { slug: 'noutati', key: 'news', label: 'Noutăți', capability: CAP.contentRead },
      { slug: 'decontat-cas', key: 'decontat-cas', label: 'Decontare CAS', capability: CAP.contentRead },
      { slug: 'quiz', key: 'quiz', label: 'Quiz', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Media & guvernanță',
    items: [
      { slug: 'media', key: 'media', label: 'Bibliotecă media', capability: CAP.contentRead },
      { slug: 'legal', key: 'legal', label: 'Legal / GDPR', capability: CAP.contentRead },
      { slug: 'audit', key: 'audit', label: 'Istoric audit', capability: CAP.audit },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAVIGATION.flatMap((group) => group.items);
