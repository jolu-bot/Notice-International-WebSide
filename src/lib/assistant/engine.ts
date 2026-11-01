import 'server-only';
import type { Content } from '@/content/fr';
import type { Settings } from '@/content/settings';
import type { Locale } from '@/lib/i18n';
import type { Doc } from './knowledge';

/**
 * Moteur de réponse local d'Écho : compréhension par intentions + recherche dans la base
 * de connaissances. Il répond seul quand aucun modèle de langue n'est configuré, et sert
 * de filet de sécurité si le service d'IA est indisponible.
 */
export type Handoff = 'none' | 'ceo' | 'assistant' | 'both';
export type Reply = { text: string; actions: string[]; handoff: Handoff; suggestions: string[] };

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@+ ]+/g, ' ').replace(/\s+/g, ' ').trim();

const STOP = new Set(('le la les un une des de du et ou a au aux en dans sur pour par avec sans ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs je tu il elle on nous vous ils elles me te se y est sont etre avoir ai as avez ont fait faire peux peut pouvez voudrais veux souhaite quel quelle quels quelles quoi qui que qu comment combien pourquoi quand ici bonjour merci svp stp plait est-ce ' +
  'the a an of and or to in on for with without is are be have has do does can could would like want i you we they it my your our their what which who how when where why please hello thanks').split(' '));

function sentences(text: string, max: number) {
  const parts = text.replace(/\n- /g, ' ; ').split(/(?<=[.!?])\s+/);
  let out = '';
  for (const p of parts) { if ((out + p).length > max && out) break; out += (out ? ' ' : '') + p; }
  return out;
}

function retrieve(q: string, docs: Doc[]) {
  const terms = normalize(q).split(' ').filter((t) => t.length > 2 && !STOP.has(t));
  if (!terms.length) return [];
  return docs.map((d) => {
    const title = normalize(d.title).split(' ');
    const body = normalize(d.text).split(' ');
    let score = 0;
    let matched = 0;
    let exactTitle = false;
    for (const t of terms) {
      // Radical tolérant (pluriels, conjugaisons) uniquement pour les mots assez longs
      const stem = t.length >= 6 ? t.slice(0, t.length - 2) : t;
      const hit = (w: string) => w === t || (stem !== t && w.startsWith(stem) && Math.abs(w.length - t.length) <= 3);
      if (title.some((w) => w === t)) { score += 3; matched++; exactTitle = true; }
      else if (title.some(hit)) { score += 2; matched++; }
      else if (body.some(hit)) { score += 1; matched++; }
    }
    // Un seul mot approchant ne suffit pas : il faut deux termes communs, ou un nom exact (client, expertise…)
    const relevant = matched >= Math.min(2, terms.length) || exactTitle;
    const weight = d.id.startsWith('service:') || d.id === 'immo' ? 1.5 : d.id.startsWith('faq:') ? 1.3 : 1;
    return { d, exact: exactTitle, score: relevant ? (score * weight) / Math.sqrt(terms.length) : 0 };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
}

const has = (q: string, re: RegExp) => re.test(q);

/** Vocabulaire courant → expertise : « louer un appartement » mène aux services immobiliers, etc. */
const TOPICS: Array<[RegExp, string]> = [
  [/\b(immobili|location|louer|loyer|appartements?|logements?|terrains?|foncier|patrimoine|bail|real estate|property|properties|rent|rental|apartments?|landlord|land title)/g, 'service:immobilier'],
  [/\b(construi|construction|batiments?|chantiers?|btp|genie civil|plomberie|electricite|electrique|domotique|climatisation|solaires?|panneaux?|photovolta|energies?|onduleur|build|building|houses?|solar|energy|electrical|plumbing|air condition)/g, 'service:btp-energie'],
  [/\b(etudes? de marche|sondages?|enquetes?|business plan|faisabilite|audits?|strategi|market research|surveys?|feasibility|strategy|consulting)/g, 'service:strategie-conseil'],
  [/\b(logos?|identite visuelle|charte graphique|affiches?|flyers?|brochures?|packagings?|emballages?|impression|imprim|kakemonos?|enseignes?|graphis|design|branding)/g, 'service:creation-design'],
  [/\b(spots?|videos?|radio|tele\b|television|films?|clips?|plan media|achat d espace|affichage|tv ad|media plan|commercials?)/g, 'service:audiovisuel-medias'],
  [/\b(hotesses?|stewards?|animateurs?|animatrices?|hostess(es)?|staffing|formation du personnel)/g, 'service:talents-formation'],
  [/\b(evenements?|evenementiel|salons?|lancement|soirees?|conferences?|ceremonies?|seminaires?|galas?|concerts?|stands?|events?|launch|trade shows?)/g, 'service:evenementiel'],
  [/\b(roadshows?|caravanes?|street marketing|activations?|sampling|degustations?|merchandising|animation commerciale|porte a porte|marketing terrain|field marketing)/g, 'service:marketing-terrain'],
  [/\b(site web|site internet|reseaux sociaux|facebook|instagram|tiktok|community manag|digital|numerique|cyber|securite informatique|piratage|website|social media|hacking)/g, 'service:digital-cybersecurite'],
];
function topicOf(q: string) {
  let best: string | null = null;
  let max = 0;
  for (const [re, id] of TOPICS) {
    const n = q.match(re)?.length ?? 0;
    if (n > max) { max = n; best = id; }
  }
  return best;
}
const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);

export function localReply(message: string, locale: Locale, c: Content, s: Settings, docs: Doc[]): Reply {
  const fr = locale === 'fr';
  const q = normalize(message);
  const words = q.split(' ').filter(Boolean);
  const T = (a: string, b: string) => (fr ? a : b);
  const ceo = s.contact.whatsapp[0];
  const asst = s.contact.whatsapp[1];
  const sugg = {
    services: T('Que proposez-vous ?', 'What do you offer?'),
    quote: T('Je veux un devis', 'I’d like a quote'),
    meeting: T('Prendre rendez-vous', 'Book a meeting'),
    where: T('Où êtes-vous situés ?', 'Where are you located?'),
    work: T('Vos réalisations', 'Your work'),
    solar: T('Installer du solaire', 'Install solar power'),
    human: T('Parler à quelqu’un', 'Talk to someone'),
    hours: T('Vos horaires ?', 'Opening hours?'),
  };

  // 0. Un client cité explicitement : on présente la réalisation correspondante
  const padded = ` ${q} `;
  const client = c.work.items.find((w) => {
    if (/notice international|divers|various/i.test(w.client)) return false;
    // « MTN Cameroon » → « mtn cameroon » et « mtn » ; « Huawei · Nestlé » → chaque marque
    const names = w.client.split(/[·,/]/).flatMap((part) => {
      const n = normalize(part);
      const first = n.split(' ')[0];
      return [n, ...(first.length >= 3 && first !== 'sci' && first !== 'go' ? [first] : [])];
    }).filter((n) => n.length >= 3);
    return names.some((n) => padded.includes(` ${n} `));
  });
  if (client && !has(q, /\b(prix|tarif|devis|combien|quote|price|cost)\b/)) {
    return {
      text: T(`Oui ! **${client.client}** fait partie de nos références : ${client.summary}`, `Yes! **${client.client}** is one of our clients: ${client.summary}`),
      actions: [`work:${client.slug}`, 'work', 'quote'], handoff: 'none', suggestions: [sugg.services, sugg.meeting],
    };
  }

  // 1. Demande explicite d'un humain
  const wantsCeo = has(q, /\b(directeur|dg|ceo|patron|fondateur|president|timothe|diwondi|director|founder|owner|boss|manager|gerant|responsable)\b/);
  const wantsAsst = has(q, /\b(assistante?|secretaire|augustine|bisseck|angel|assistant)\b/);
  const wantsHuman = has(q, /\b(humain|human|quelqu ?un|personne reelle|real person|conseiller|advisor|someone|agent|operateur)\b/) || has(q, /\b(parler|discuter|joindre|contacter|talk|speak|reach)\b/) && (wantsCeo || wantsAsst);
  if (wantsHuman || ((wantsCeo || wantsAsst) && words.length <= 6)) {
    const who: Handoff = wantsCeo && !wantsAsst ? 'ceo' : wantsAsst && !wantsCeo ? 'assistant' : 'both';
    return {
      text: who === 'ceo'
        ? T(`Avec plaisir. **${ceo?.name}**, ${ceo?.label.toLowerCase()}, peut vous répondre directement sur WhatsApp ou par téléphone.`, `Of course. **${ceo?.name}** (${ceo?.label}) can answer you directly on WhatsApp or by phone.`)
        : who === 'assistant'
          ? T(`Bien sûr. **${asst?.name}**, notre ${asst?.label.toLowerCase()}, vous répond directement — c’est souvent elle qui organise les rendez-vous.`, `Of course. **${asst?.name}** (${asst?.label}) will answer you directly — she usually organises meetings.`)
          : T('Bien sûr. Voici les deux personnes qui peuvent vous répondre directement, selon votre besoin.', 'Of course. Here are the two people who can answer you directly, depending on your needs.'),
      actions: ['contact'], handoff: who, suggestions: [sugg.meeting, sugg.quote],
    };
  }

  // 2. Sujets qui demandent un engagement humain
  if (has(q, /\b(reclamation|plainte|litige|mecontent|insatisfait|arnaque|complaint|refund|rembourse)/)) {
    return { text: T('Je suis désolé de l’apprendre. Une réclamation mérite une réponse personnelle : je vous mets directement en relation avec la Direction.', 'I’m sorry to hear that. A complaint deserves a personal answer: let me put you in touch with management directly.'), actions: [], handoff: 'ceo', suggestions: [] };
  }
  if (has(q, /\b(partenariat|partenaire|sponsor|sponsoring|presse|journaliste|interview|media partner|partnership|partner|press|investir|investor|appel d ?offres?|tender)/)) {
    return { text: T('C’est une demande qui se traite directement avec la Direction générale. Je vous passe le relais : vous pouvez écrire ou appeler sans attendre.', 'That’s best handled directly with our managing director. Let me hand you over: you can message or call right away.'), actions: ['agency'], handoff: 'ceo', suggestions: [sugg.work] };
  }
  if (has(q, /\b(facture|paiement|payer|reglement|virement|acompte|invoice|payment|pay|receipt)/)) {
    return { text: T('Pour les factures et les paiements, l’assistance de direction s’occupe de vous personnellement.', 'For invoices and payments, our executive assistant will take care of you personally.'), actions: [], handoff: 'assistant', suggestions: [] };
  }

  // 3. Politesse
  if (words.length <= 5 && has(q, /^(bonjour|bonsoir|salut|hello|hi|hey|coucou|yo|good (morning|afternoon|evening)|bjr|slt)\b/)) {
    return { text: T(`Bonjour et bienvenue chez ${s.brand.name} ! Je suis ${c.assistant.name}. Que puis-je faire pour vous : découvrir nos expertises, préparer un devis, prendre rendez-vous ?`, `Hello and welcome to ${s.brand.name}! I’m ${c.assistant.name}. How can I help: exploring our services, preparing a quote, booking a meeting?`), actions: [], handoff: 'none', suggestions: [sugg.services, sugg.quote, sugg.meeting] };
  }
  if (words.length <= 6 && has(q, /\b(merci|thanks?|thank you|parfait|super|genial|top|great|perfect)\b/)) {
    return { text: T('Avec plaisir ! Et si, cette fois, c’était vous qu’on écoutait ? Je reste là si vous avez une autre question.', 'My pleasure! I’m here if you have any other question.'), actions: [], handoff: 'none', suggestions: [sugg.meeting, sugg.quote] };
  }
  if (words.length <= 4 && has(q, /\b(au revoir|bye|a bientot|bonne journee|bonne soiree|ciao|see you)\b/)) {
    return { text: T('Au revoir, et à très bientôt chez Notice International !', 'Goodbye, and see you soon at Notice International!'), actions: [], handoff: 'none', suggestions: [] };
  }

  // 4. Intentions pratiques
  if (has(q, /\b(prix|tarifs?|couts?|combien|budget|devis|cotation|estimation|quote|price|pricing|cost|how much|rates?)\b/)) {
    return {
      text: T(`Chaque projet est unique : nous établissons un **devis gratuit et sur mesure** à partir de vos objectifs, de votre calendrier et de votre budget. Le formulaire prend deux minutes, en trois étapes — budgets indicatifs de « ${c.quotePage.budgets[0]} » à « ${c.quotePage.budgets[c.quotePage.budgets.length - 2]} ».`,
        `Every project is unique: we prepare a **free, tailor-made quote** based on your goals, timeline and budget. The form takes two minutes, in three steps.`),
      actions: ['quote', 'appointment'], handoff: 'none', suggestions: [sugg.services, sugg.human],
    };
  }
  if (has(q, /\b(rendez|rdv|rencontr|reunion|entretien|visio|meeting|appointment|book|booking|schedule|rencontre)/)) {
    return {
      text: T(`Vous pouvez réserver en ligne en moins d’une minute : choisissez la date, le créneau et le format — ${Object.values(c.appointmentPage.modes).join(', ').toLowerCase()}. Créneaux en semaine : ${s.hours.slots} ; le samedi : ${s.hours.saturdaySlots}. Nous confirmons par e-mail ou WhatsApp.`,
        `You can book online in under a minute: pick a date, a time slot and a format — ${Object.values(c.appointmentPage.modes).join(', ').toLowerCase()}. Weekday slots: ${s.hours.slots}; Saturday: ${s.hours.saturdaySlots}. We confirm by e-mail or WhatsApp.`),
      actions: ['appointment'], handoff: 'none', suggestions: [sugg.where, sugg.hours],
    };
  }
  if (has(q, /\b(horaires?|heures?|ouvert|ouverture|ferme|fermeture|samedi|dimanche|week ?end|open|opening|hours|closed|saturday|sunday)\b/)) {
    return {
      text: T(`L’agence vous accueille du **lundi au vendredi de ${s.hours.weekdays}** et le **samedi de ${s.hours.saturday}**. Elle est fermée le dimanche. Sur WhatsApp, vous pouvez nous écrire à tout moment.`,
        `The agency is open **Monday to Friday, ${s.hours.weekdays}** and **Saturday, ${s.hours.saturday}**. Closed on Sundays. On WhatsApp, you can message us anytime.`),
      actions: ['appointment', 'contact'], handoff: 'none', suggestions: [sugg.where, sugg.meeting],
    };
  }
  const whereRe = fr ? /\b(ou (etes|est|se trouve|vous trouver|vous situe)|adresse|situes?|localis|itineraire|plan d ?acces|venir a l ?agence|trouver l ?agence|akwa|laquintinie|palais dika)/
    : /\b(where|address|located|location|directions|map|akwa|laquintinie|palais dika)\b/;
  if (has(q, whereRe)) {
    return {
      text: T(`Nous sommes à **${s.address.street}, ${s.address.district} — ${s.address.city}**, ${lowerFirst(s.address.landmark)}. ${c.contactPage.directions.join(' ')}`,
        `We’re at **${s.address.street}, ${s.address.district} — ${s.address.city}**, ${lowerFirst(s.address.landmark)}. ${c.contactPage.directions.join(' ')}`),
      actions: ['contact', 'appointment'], handoff: 'none', suggestions: [sugg.hours, sugg.meeting],
    };
  }
  if (has(q, /\b(telephone|tel|numero|appeler|mail|e ?mail|courriel|whatsapp|joindre|contacter|contact|phone|call|number|reach)\b/)) {
    return {
      text: T(`Vous pouvez nous joindre au **${s.contact.phonePrimary}** ou au ${s.contact.phoneSecondary}, par e-mail à **${s.contact.email}**, ou sur WhatsApp — directement avec la Direction ou l’Assistance.`,
        `You can reach us on **${s.contact.phonePrimary}** or ${s.contact.phoneSecondary}, by e-mail at **${s.contact.email}**, or on WhatsApp — directly with management or the assistant.`),
      actions: ['contact'], handoff: 'both', suggestions: [sugg.meeting, sugg.where],
    };
  }
  const wantsJob = has(q, /\b(emploi|job|jobs|candidature|candidater|postuler|cv|stage|stagiaire|career|careers|hiring|internship|apply|vacancy|vacancies)\b/)
    || has(q, /\b(devenir|travailler (chez|avec) vous|rejoindre|work for you|join (you|your team)|become)\b/) || has(q, /\b(recrutez|vous recrutez|embauchez)\b/);
  if (wantsJob) {
    return {
      text: T(`${c.careersPage.lead} Déposez votre candidature en ligne (profil, expérience, disponibilité) : nous vous recontactons lors de nos prochains castings.`, `${c.careersPage.lead} Apply online (profile, experience, availability): we’ll get back to you for our next castings.`),
      actions: ['careers'], handoff: 'none', suggestions: [sugg.services],
    };
  }
  if (has(q, /\b(site|website)\b/) && has(q, /\b(qui|cree|fait|realise|developpe|who|made|built|created)\b/) || has(q, /joyed/)) {
    return { text: T('Ce site a été conçu et développé par **JoYed’S**, partenaire technologique de Notice International (IT, transformation digitale et cybersécurité).', 'This website was designed and built by **JoYed’S**, Notice International’s technology partner (IT, digital transformation and cybersecurity).'), actions: ['agency'], handoff: 'none', suggestions: [sugg.services] };
  }
  if (has(q, /\b(equipe|qui dirige|fondateur|team|founder|staff|collaborateurs|qui travaille)\b/)) {
    return {
      text: c.team.members.map((m) => `- **${m.name}** — ${m.role}`).join('\n') + T('\n\nUne équipe resserrée, épaulée par des équipes terrain aguerries et des partenaires de confiance.', '\n\nA tight-knit team, backed by seasoned field teams and trusted partners.'),
      actions: ['agency'], handoff: 'none', suggestions: [sugg.human, sugg.work],
    };
  }

  // 5. Recherche dans la base (expertise, réalisation, client, FAQ…)
  const hits = retrieve(message, docs);
  const topic = topicOf(q);
  const topicDoc = topic ? docs.find((d) => d.id === topic) : undefined;
  const strongFaq = hits[0] && hits[0].d.id.startsWith('faq:') && hits[0].score >= 2.5;
  if (topicDoc && !strongFaq && !(hits[0]?.exact && hits[0].d.id !== topic && hits[0].score >= 3)) {
    return {
      text: `**${topicDoc.title.replace(/ \(.*\)$/, '')}** — ${sentences(topicDoc.text, 420)}`,
      actions: [topicDoc.action ?? 'services', 'quote', 'appointment'], handoff: 'none', suggestions: [sugg.work, sugg.human],
    };
  }
  const generic = has(q, /\b(services?|propos|offre[sz]?|faites|expertises?|domaines?|metiers?|activites?|what do you|offer|do you do)\b/);
  if (generic && (!hits.length || (!hits[0].exact && hits[0].score < 3))) {
    const com = c.services.items.filter((x) => x.universe === 'com').map((x) => x.title);
    const immo = c.services.items.filter((x) => x.universe === 'immo').map((x) => x.title);
    return {
      text: T(`Deux univers, une même exigence :\n- **Notice International** — ${com.join(', ')}.\n- **Notice Immo & Building** — ${immo.join(', ')}.\nQuel domaine vous intéresse ? Je vous en dis plus.`,
        `Two worlds, one standard:\n- **Notice International** — ${com.join(', ')}.\n- **Notice Immo & Building** — ${immo.join(', ')}.\nWhich area interests you? I’ll tell you more.`),
      actions: ['services', 'immo'], handoff: 'none', suggestions: [sugg.solar, sugg.work, sugg.quote],
    };
  }
  if (has(q, /\b(realisations?|references?|clients?|portfolio|campagnes?|travaille avec|worked with|case stud|your work)\b/) && (!hits.length || !hits[0].exact)) {
    return {
      text: T(`Parmi les marques qui nous ont confié leur voix : ${c.clients.items.slice(0, 12).join(', ')}… Campagnes nationales, événements, études, créations : tout est à découvrir dans nos réalisations.`,
        `Brands that trusted us with their voice include ${c.clients.items.slice(0, 12).join(', ')}… National campaigns, events, studies, creative work: see it all in our portfolio.`),
      actions: ['work'], handoff: 'none', suggestions: [sugg.services, sugg.quote],
    };
  }
  if (hits.length && hits[0].score >= 1.4) {
    const top = hits[0].d;
    const second = hits[1]?.d.action;
    const extra: string[] = second && hits[1].score >= hits[0].score * 0.8 && second !== top.action ? [second] : [];
    const isFaq = top.id.startsWith('faq:');
    const intro = isFaq ? '' : T(`**${top.title}** — `, `**${top.title}** — `);
    return {
      text: `${intro}${sentences(top.text, 420)}`,
      actions: [...(top.action ? [top.action] : []), ...extra, top.id.startsWith('service:') || top.id === 'immo' ? 'quote' : 'appointment'].slice(0, 3),
      handoff: 'none', suggestions: [sugg.quote, sugg.human],
    };
  }

  // 6. Hors de portée : on passe le relais plutôt que d'improviser
  return {
    text: T('Je préfère ne pas vous répondre approximativement. L’équipe connaît votre sujet mieux que moi : je vous mets en relation directe avec la Direction ou l’Assistance, selon votre besoin.',
      'I’d rather not give you an approximate answer. The team knows this better than I do: let me put you in touch directly with management or the assistant.'),
    actions: ['contact'], handoff: 'both', suggestions: [sugg.services, sugg.meeting],
  };
}
