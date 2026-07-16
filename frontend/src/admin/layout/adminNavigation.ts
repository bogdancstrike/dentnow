import { CAP } from '../auth/permissions';

export interface AdminNavItem {
  slug: string;
  key: string;
  label: string;
  capability?: string;
}

export const ADMIN_NAVIGATION: { group: string; items: AdminNavItem[] }[] = [
  {
    group: 'Performanță',
    items: [
      { slug: 'analytics', key: 'analytics', label: 'Analytics', capability: CAP.analytics },
    ],
  },
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
      { slug: 'reviws', key: 'reviews', label: 'Recenzii', capability: CAP.contentRead },
      { slug: 'before-after', key: 'before-after', label: 'Before & After', capability: CAP.contentRead },
      { slug: 'decontat-cas', key: 'decontat-cas', label: 'Decontare CAS', capability: CAP.contentRead },
      { slug: 'texte-site', key: 'site-texts', label: 'Texte site', capability: CAP.contentRead },
      { slug: 'quiz', key: 'quiz', label: 'Quiz', capability: CAP.contentRead },
    ],
  },
  {
    group: 'Guvernanță',
    items: [
      { slug: 'legal', key: 'legal', label: 'Legal / GDPR', capability: CAP.contentRead },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAVIGATION.flatMap((group) => group.items);
