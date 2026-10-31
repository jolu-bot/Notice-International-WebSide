/**
 * Paramètres communs aux deux langues — modifiables depuis /admin → Paramètres.
 */
export const settings = {
  brand: {
    name: 'Notice International',
    legalName: 'NOTICE INTERNATIONAL',
    branch: 'Notice Immo & Building',
    slogan: '7X faites-vous écouter',
    foundingYear: '2000',
    branchYear: '2020',
  },
  contact: {
    email: 'contact@noticeinternational.com',
    phonePrimary: '+237 699 90 28 79',
    phoneSecondary: '+237 677 70 80 95',
    whatsapp: [
      { label: 'Direction générale', name: 'Timothé Diwondi', number: '237699902879' },
      { label: 'Assistance de direction', name: 'Augustine Bisseck', number: '237694257421' },
    ],
  },
  address: {
    street: 'Rue Palais Dika',
    district: 'Akwa',
    city: 'Douala',
    region: 'Littoral',
    country: 'Cameroun',
    countryCode: 'CM',
    landmark: 'À proximité de l’Hôpital Laquintinie',
    mapQuery: 'Hôpital Laquintinie, Akwa, Douala, Cameroun',
  },
  hours: {
    weekdays: '08:00–17:30',
    saturday: '09:00–13:00',
    slots: '08:30, 09:30, 10:30, 11:30, 14:00, 15:00, 16:00',
    saturdaySlots: '09:00, 10:00, 11:00',
  },
  socials: {
    facebook: 'https://www.facebook.com/noticeinternational',
    instagram: 'https://www.instagram.com/noticeinternational',
    x: 'https://x.com/noticeintl',
    tiktok: 'https://www.tiktok.com/@noticeinternational',
    linkedin: '',
    youtube: '',
  },
  legal: {
    form: 'Entreprise de droit camerounais',
    rccm: 'RC/DLN/2019/B/382',
    niu: 'M021912753322A',
    taxRegime: 'Régime du réel',
    director: 'Timothé Diwondi',
    hostName: 'Vercel Inc.',
    hostAddress: '440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com',
    dataHost: 'Supabase Inc. (base de données hébergée dans l’Union européenne — Paris, eu-west-3)',
  },
  credits: {
    label: 'Powered by JoYed’S',
    url: 'https://www.joyeds.com',
  },
};

export type Settings = typeof settings;
