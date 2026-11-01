/** Libellés lisibles pour l'éditeur de contenus. */
export const SECTION_GROUPS: Array<{ title: string; sections: Array<{ key: string; label: string; hint?: string; preview?: string }> }> = [
  {
    title: 'Page d’accueil',
    sections: [
      { key: 'hero', label: 'Héros (première vue)', hint: 'Grand titre, verbes animés, accroche, boutons.', preview: '' },
      { key: 'manifesto', label: 'Manifeste', preview: '' },
      { key: 'stats', label: 'Chiffres clés', hint: 'Jetons : {years} = années depuis la création, {clients} = nombre de clients.', preview: '' },
      { key: 'universes', label: 'Deux univers', preview: '' },
      { key: 'method', label: 'Notre démarche', preview: '' },
      { key: 'showreel', label: 'Showreel (film)', preview: '' },
      { key: 'why', label: 'Pourquoi nous faire confiance', preview: '' },
      { key: 'faq', label: 'Questions fréquentes', preview: '' },
      { key: 'cta', label: 'Appel à l’action final', preview: '' },
    ],
  },
  {
    title: 'Offres & références',
    sections: [
      { key: 'services', label: 'Expertises (9 pages)', hint: 'Chaque expertise possède sa propre page. Le « slug » forme l’adresse de la page.', preview: 'expertises' },
      { key: 'work', label: 'Réalisations (études de cas)', hint: 'Catégories possibles : strategie, creation, evenementiel, terrain, talents.', preview: 'realisations' },
      { key: 'clients', label: 'Clients (mur des marques)', preview: '' },
      { key: 'team', label: 'Équipe', hint: 'Ajoutez une photo pour remplacer le monogramme.', preview: 'agence' },
    ],
  },
  {
    title: 'Pages',
    sections: [
      { key: 'agencyPage', label: 'L’agence', preview: 'agence' },
      { key: 'immoPage', label: 'Immo & Building', preview: 'immo-building' },
      { key: 'contactPage', label: 'Contact & plan d’accès', preview: 'contact' },
      { key: 'appointmentPage', label: 'Rendez-vous', preview: 'rendez-vous' },
      { key: 'quotePage', label: 'Devis', preview: 'devis' },
      { key: 'careersPage', label: 'Carrières & casting', preview: 'carrieres' },
      { key: 'notFound', label: 'Page 404' },
    ],
  },
  {
    title: 'Interface',
    sections: [
      { key: 'nav', label: 'Menu & navigation' },
      { key: 'footer', label: 'Pied de page' },
      { key: 'forms', label: 'Formulaires (libellés & listes)' },
      { key: 'newsletter', label: 'Lettre d’information' },
      { key: 'whatsapp', label: 'Bouton WhatsApp' },
      { key: 'assistant', label: 'Assistant Écho', hint: 'Nom, messages d’accueil, suggestions et libellés. Ses connaissances viennent automatiquement des autres contenus du site.' },
      { key: 'cookies', label: 'Bandeau cookies' },
      { key: 'common', label: 'Libellés communs' },
      { key: 'preloader', label: 'Écran d’ouverture' },
      { key: 'easter', label: 'Surprise « 7X »', hint: 'S’affiche après 7 clics sur le logo.' },
    ],
  },
  {
    title: 'SEO & légal',
    sections: [
      { key: 'meta', label: 'Référencement (SEO)', hint: 'Titres et descriptions de chaque page pour Google et les réseaux sociaux.' },
      { key: 'legal', label: 'Mentions légales, confidentialité, cookies, CGU', hint: 'Mise en forme : « ## Titre », « - élément de liste », **gras**, *italique*. Jetons : {rccm}, {niu}, {email}…', preview: 'mentions-legales' },
    ],
  },
];

const FIELD: Record<string, string> = {
  title: 'Titre', text: 'Texte', label: 'Étiquette', intro: 'Introduction', lead: 'Chapô', kicker: 'Surtitre', items: 'Éléments',
  image: 'Image', cover: 'Image de couverture', gallery: 'Galerie d’images', description: 'Description', points: 'Points clés',
  slug: 'Adresse de la page (slug)', short: 'Accroche', body: 'Contenu', summary: 'Résumé', client: 'Client', year: 'Année',
  location: 'Lieu', category: 'Catégorie', name: 'Nom', role: 'Fonction', bio: 'Biographie', phone: 'Téléphone', email: 'E-mail',
  photo: 'Photo', q: 'Question', a: 'Réponse', value: 'Valeur', suffix: 'Suffixe', cta: 'Bouton', ctaPrimary: 'Bouton principal',
  ctaSecondary: 'Bouton secondaire', primary: 'Bouton principal', secondary: 'Bouton secondaire', verbs: 'Verbes animés', verbsIntro: 'Introduction des verbes',
  titleA: 'Titre — ligne 1', titleB: 'Titre — ligne 2', members: 'Membres', partner: 'Partenaire technologique', steps: 'Étapes',
  universe: 'Univers (com / immo)', services: 'Expertises liées (slugs)', filters: 'Filtres', signature: 'Signature', tag: 'Étiquette',
  timeline: 'Repères chronologiques', values: 'Valeurs', perks: 'Avantages', url: 'Lien', words: 'Mots', pages: 'Pages',
  defaultTitle: 'Titre par défaut', titleTemplate: 'Modèle de titre', keywords: 'Mots-clés (séparés par des virgules)', siteName: 'Nom du site',
  updated: 'Date de mise à jour', notice: 'Mentions légales', privacy: 'Confidentialité', cookiesPolicy: 'Politique de cookies', terms: 'CGU',
  directions: 'Itinéraire (étapes)', landmarks: 'Repères du plan', modes: 'Formats de rendez-vous', subjects: 'Objets proposés',
  brand: 'Marque', contact: 'Coordonnées', address: 'Adresse', hours: 'Horaires & créneaux', socials: 'Réseaux sociaux', legal: 'Informations légales',
  credits: 'Crédits', whatsapp: 'Numéros WhatsApp', number: 'Numéro (format international sans +, ex. 237699902879)',
  slots: 'Créneaux en semaine (séparés par des virgules)', saturdaySlots: 'Créneaux du samedi', weekdays: 'Horaires en semaine', saturday: 'Horaires du samedi',
  mapQuery: 'Recherche Google Maps', landmark: 'Repère', rccm: 'RCCM', niu: 'NIU', foundingYear: 'Année de création', branchYear: 'Année Immo & Building',
};

export function fieldLabel(key: string) {
  if (FIELD[key]) return FIELD[key];
  const s = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const isImageKey = (key: string) => /^(image|cover|photo|logo|poster)$/i.test(key);
export const isGalleryKey = (key: string) => /^(gallery|images)$/i.test(key);
export const isLongText = (key: string, value: string) => /^(body|text|description|bio|a|lead|intro|summary|preamble|passion|tagline)$/i.test(key) || value.length > 90 || value.includes('\n');

export const KIND_LABEL: Record<string, string> = { contact: 'Contact', appointment: 'Rendez-vous', quote: 'Devis', career: 'Candidature', newsletter: 'Newsletter' };
export const STATUS_LABEL: Record<string, string> = { new: 'Nouveau', in_progress: 'En cours', done: 'Traité', archived: 'Archivé' };
export const ROLE_LABEL: Record<string, string> = { owner: 'Propriétaire', admin: 'Administrateur', editor: 'Éditeur' };
export const DATA_LABEL: Record<string, string> = {
  company: 'Entreprise', subject: 'Objet', message: 'Message', mode: 'Format', when: 'Date & heure', notes: 'Précisions', services: 'Expertises',
  description: 'Projet', goal: 'Objectif', timeline: 'Échéance', budget: 'Budget', city: 'Ville', profile: 'Profil', experience: 'Expérience',
  availability: 'Disponibilité', link: 'CV / portfolio', source: 'Source', date: 'Date', time: 'Heure',
};
