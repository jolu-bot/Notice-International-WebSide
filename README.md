# Notice International — site officiel

> **7X faites-vous écouter.** Agence conseil en marketing & communication (Douala, depuis 2000) et sa branche **Notice Immo & Building** (BTP, énergie solaire, immobilier).

Site bilingue (FR/EN) avec espace d’administration intégré. Conception & développement : **[JoYed’S](https://www.joyeds.com)**.

---

## Ce que contient le site

| Page | FR | EN |
|---|---|---|
| Accueil | `/fr` | `/en` |
| L’agence | `/fr/agence` | `/en/agency` |
| Expertises (+ 9 pages détaillées) | `/fr/expertises/…` | `/en/expertise/…` |
| Immo & Building | `/fr/immo-building` | `/en/immo-building` |
| Réalisations (+ 14 études de cas) | `/fr/realisations/…` | `/en/work/…` |
| Contact & plan d’accès | `/fr/contact` | `/en/contact` |
| Prise de rendez-vous (agenda) | `/fr/rendez-vous` | `/en/appointment` |
| Demande de devis (3 étapes) | `/fr/devis` | `/en/quote` |
| Carrières & casting | `/fr/carrieres` | `/en/careers` |
| Actualités (+ une page par article) | `/fr/actualites/…` | `/en/news/…` |
| Mentions légales · Confidentialité · Cookies · CGU | `/fr/mentions-legales` … | `/en/legal-notice` … |
| **Administration** (aussi `/connexion`, `/login`) | `/admin` | |

**Expérience** : écran d’ouverture (la bouche-logo s’assemble, le compteur remonte de 2000 à aujourd’hui), logo recomposé en milliers de points lumineux qui réagissent au curseur et « parlent », verbes stratégiques animés, défilement fluide, transitions « rideau mosaïque », curseur sur mesure, plan d’accès animé, galerie plein écran, film de marque… Et un secret : **cliquez 7 fois sur le logo**.

**Apparence** : quatre thèmes au choix du visiteur (bouton dans l’en-tête) — *Signature* (l’alternance clair-sombre, par défaut), *Clair*, *Sombre*, *Automatique* (suit l’appareil).

**Écho, l’assistant** : orbe en bas à droite. Il répond en français et en anglais à partir des contenus du site (mis à jour automatiquement avec le CMS), oriente vers la bonne page et passe le relais au CEO ou à son assistante (WhatsApp pré-rempli, appel) quand la demande le dépasse. Dictée vocale. Sans clé d’IA, il fonctionne avec son moteur local ; avec `ANTHROPIC_API_KEY`, il devient pleinement conversationnel (Claude). Ses textes se modifient dans *Contenus → Assistant Écho*.

**Sécurité** : politique de sécurité du contenu stricte (aucun script tiers), en-têtes durcis, contrôle d’origine, limites de taille et de débit sur toutes les API, droits par colonne et anti-spam au niveau de la base, déconnexion de l’administration après 45 min d’inactivité. Signalement de faille : `/.well-known/security.txt`.

**Référencement** : métadonnées par page et par langue, `hreflang`, URL traduites, données structurées Schema.org (Organisation, Service, FAQ, fil d’Ariane, études de cas), `sitemap.xml`, `robots.txt`, `llms.txt` (moteurs IA), images de partage, manifeste PWA.

---

## Espace d’administration — `/admin`

Connexion par e-mail + mot de passe. À la première connexion, chacun choisit son mot de passe personnel.

- **Tableau de bord** : nouvelles demandes, prochains rendez-vous, dernières modifications.
- **Demandes** : messages, rendez-vous, devis, candidatures, inscriptions — filtres, recherche, statuts, notes internes, réponse en un clic (e-mail, WhatsApp, téléphone), export CSV (Excel).
- **Contenus** : *tous* les textes du site, en français et en anglais, section par section — titres, accroches, expertises, réalisations (ajout, suppression, réordonnancement, galeries), équipe (photos), FAQ, SEO, pages légales… Chaque enregistrement est **publié immédiatement** et **historisé** (bouton « Historique » pour restaurer une version, « Rétablir l’origine » pour revenir aux textes livrés).
- **Paramètres généraux** : téléphones, numéros WhatsApp, e-mail, adresse, **liens des réseaux sociaux** (X, Instagram, Facebook, TikTok, LinkedIn, YouTube), horaires et créneaux de rendez-vous, informations légales.
- **Actualités** : rédaction bilingue (le français suffit, l’anglais est facultatif), image de couverture, catégorie, aperçu, brouillon, publication immédiate ou **programmée** à une date future. Les trois derniers articles apparaissent sur l’accueil ; Écho les connaît.
- **Médiathèque** : glisser-déposer d’images (optimisées automatiquement en WebP), PDF, vidéos.
- **Équipe & accès** : donner un accès à une personne (Propriétaire / Administrateur / Éditeur), générer un nouveau mot de passe, désactiver un accès.

| Rôle | Peut… |
|---|---|
| Propriétaire | tout, y compris gérer les administrateurs |
| Administrateur | contenus, demandes, médiathèque, accès des éditeurs |
| Éditeur | contenus, demandes, médiathèque |

---

## Architecture technique

- **Next.js 16** (App Router, rendu statique + revalidation à la demande), **React 19**, **TypeScript**, **Tailwind CSS 4**
- Animations : **GSAP 3** (ScrollTrigger, SplitText, Flip) + **Lenis** ; canevas 2D maison pour le logo en particules
- Données : **Supabase** (Postgres + Auth + Storage), sécurisé par Row Level Security — schéma dans `supabase/migrations/`
- Hébergement : **Vercel**

```
src/
  app/[locale]/…        pages publiques (dossiers = slugs français, slugs anglais réécrits par src/proxy.ts)
  app/admin/            espace d'administration
  app/api/forms         réception des formulaires (validation, anti-spam, enregistrement, e-mail)
  app/api/assistant     Écho : réponse en flux (Claude si configuré, moteur local sinon)
  lib/assistant/        base de connaissances (issue des contenus) et moteur de réponse local
  lib/guard.ts          protections communes des API (origine, débit, taille)
  app/api/revalidate    publication instantanée après modification
  content/fr.ts|en.ts   textes par défaut (surchargés par ce qui est saisi dans /admin)
  content/settings.ts   coordonnées, réseaux, horaires, légal
  components/           fx (animations), sections, forms, admin, brand (logo vectoriel)
```

## Sauvegarde & surveillance

- **Sauvegarde hebdomadaire** — chaque lundi à 3 h (heure de Douala), Vercel appelle `/api/cron/backup` (planifié dans `vercel.json`) : une copie complète de la base (contenus, actualités, demandes, historique, comptes, liste des médias) part par e-mail en pièce jointe JSON vers `BACKUP_TO` (à défaut `CONTACT_TO`). Gardez ces e-mails dans un dossier dédié et supprimez ceux de plus de 12 mois (engagement de la politique de confidentialité).
- **Surveillance** — `.github/workflows/surveillance.yml` vérifie toutes les 15 minutes l’accueil, le contact et `/api/health` (site + base). En cas de panne, une *issue* GitHub « Site indisponible » est ouverte (e-mail automatique au propriétaire du dépôt) puis refermée au retour du site. GitHub suspend les tâches planifiées après 60 jours sans activité sur le dépôt : un simple commit, ou « Enable workflow » dans l’onglet *Actions*, les relance.

## Variables d’environnement

Voir `.env.example`.

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL publique (canonique, sitemap). À passer à `https://www.noticeinternational.com` une fois le domaine branché. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Base de données & médiathèque |
| `CONTACT_TO` | Destinataire des formulaires (`contact@noticeinternational.com`) |
| `RESEND_API_KEY` + `MAIL_FROM` | Envoi d’e-mails soignés + accusé de réception au visiteur (recommandé) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Alternative : SMTP de votre messagerie |
| `ANTHROPIC_API_KEY` | Facultatif — rend l’assistant Écho pleinement conversationnel (Claude) |
| `CRON_SECRET` / `BACKUP_TOKEN` | Sauvegarde hebdomadaire (le jeton est généré dans la base, table `private.secrets`) |
| `BACKUP_TO` | Facultatif — destinataire des sauvegardes (par défaut `CONTACT_TO`) |
| `ASSISTANT_MODEL` | Facultatif — modèle utilisé par Écho (par défaut `claude-opus-5-5`) |

**Sans clé d’envoi**, les demandes sont toujours enregistrées dans `/admin → Demandes`, et une notification est relayée par FormSubmit : **le tout premier envoi déclenche un e-mail d’activation à `contact@noticeinternational.com` — il faut cliquer sur le lien une fois.**

## Développement

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint         # vérification TypeScript
npm run build
# machine avec peu de mémoire :
LOW_MEMORY_BUILD=1 npm run build
```

En local, `DISABLE_MAIL=1` empêche tout envoi d’e-mail pendant les tests.

## Brancher le domaine noticeinternational.com

1. Vercel → projet → *Settings → Domains* → ajouter `www.noticeinternational.com` et `noticeinternational.com`.
2. Chez le registraire du domaine, créer les enregistrements DNS indiqués par Vercel.
3. Mettre à jour `NEXT_PUBLIC_SITE_URL` puis redéployer. *(Fait : le site est en ligne sur www.noticeinternational.com.)*
4. Déclarer le site dans **Google Search Console** et soumettre `https://www.noticeinternational.com/sitemap.xml`.

---

© Notice International · Powered by [JoYed’S](https://www.joyeds.com)
