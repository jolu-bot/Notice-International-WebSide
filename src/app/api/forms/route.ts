import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { SITE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '@/lib/site';

export const runtime = 'nodejs';

const schema = z.object({
  kind: z.enum(['contact', 'appointment', 'quote', 'career', 'newsletter']),
  locale: z.enum(['fr', 'en']).default('fr'),
  name: z.string().trim().max(160).optional().default(''),
  email: z.string().trim().max(200).email(),
  phone: z.string().trim().max(40).optional().default(''),
  data: z.record(z.string(), z.union([z.string().max(5000), z.number(), z.boolean(), z.null()])).default({}),
  hp: z.string().optional().default(''),
  elapsed: z.number().optional().default(0),
});

// Limitation de débit (par instance) : 6 envois / 10 minutes / IP
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 6;
}

const LABELS: Record<string, string> = {
  company: 'Entreprise', subject: 'Objet', message: 'Message', mode: 'Format', when: 'Date & heure', notes: 'Précisions',
  services: 'Expertises', description: 'Projet', goal: 'Objectif', timeline: 'Échéance', budget: 'Budget', city: 'Ville',
  profile: 'Profil', experience: 'Expérience', availability: 'Disponibilité', link: 'CV / portfolio', source: 'Source', date: 'Date', time: 'Heure',
};
const TITLES: Record<string, string> = {
  contact: 'Nouveau message', appointment: 'Demande de rendez-vous', quote: 'Demande de devis', career: 'Nouvelle candidature', newsletter: 'Inscription à la lettre d’information',
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function emailHtml(kind: string, p: z.infer<typeof schema>) {
  const base: Array<[string, string]> = [['Nom', p.name], ['E-mail', p.email], ['Téléphone', p.phone], ['Langue', p.locale.toUpperCase()]];
  const rows: Array<[string, string]> = [
    ...base,
    ...Object.entries(p.data).filter(([k, v]) => v !== '' && v !== null && k !== 'date' && k !== 'time').map(([k, v]) => [LABELS[k] ?? k, String(v)] as [string, string]),
  ].filter(([, v]) => v);
  const wa = p.phone ? `https://wa.me/${p.phone.replace(/\D/g, '').replace(/^(6\d{8})$/, '237$1')}` : '';
  return `<!doctype html><html><body style="margin:0;background:#f5efe4;font-family:Helvetica,Arial,sans-serif;color:#070a17">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden">
    <tr><td style="height:6px;background:linear-gradient(90deg,#0068ae,#f39200,#e2001a,#13286e)"></td></tr>
    <tr><td style="padding:28px 32px 8px"><p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#888">Notice International · site web</p>
    <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-weight:400;font-size:28px">${esc(TITLES[kind])}</h1></td></tr>
    <tr><td style="padding:16px 32px 8px"><table width="100%" cellpadding="0" cellspacing="0">
    ${rows.map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;width:150px;vertical-align:top;font-size:13px;color:#888">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:15px;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}
    </table></td></tr>
    <tr><td style="padding:20px 32px 32px">
      <a href="mailto:${esc(p.email)}" style="display:inline-block;background:#070a17;color:#fff;text-decoration:none;padding:12px 20px;border-radius:99px;font-weight:bold;font-size:14px">Répondre par e-mail</a>
      ${wa ? `<a href="${wa}" style="display:inline-block;margin-left:8px;background:#25d366;color:#fff;text-decoration:none;padding:12px 20px;border-radius:99px;font-weight:bold;font-size:14px">WhatsApp</a>` : ''}
      <p style="margin:20px 0 0;font-size:12px;color:#999">Retrouvez toutes les demandes dans l’espace d’administration : ${esc(SITE_URL)}/admin</p>
    </td></tr>
  </table></td></tr></table></body></html>`;
}

function confirmationHtml(p: z.infer<typeof schema>) {
  const fr = p.locale === 'fr';
  return `<!doctype html><html><body style="margin:0;background:#070a17;font-family:Helvetica,Arial,sans-serif;color:#f5efe4">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 12px">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="height:6px;background:linear-gradient(90deg,#0068ae,#f39200,#e2001a,#13286e);border-radius:6px"></td></tr>
    <tr><td style="padding:32px 4px"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;margin:0">${fr ? 'Nous vous avons bien entendu.' : 'We hear you.'}</h1>
    <p style="font-size:16px;line-height:1.6;color:#cfc8bb">${fr ? `Bonjour ${esc(p.name || '')},<br><br>Merci pour votre message. Notre équipe l’étudie et revient vers vous très rapidement.` : `Hello ${esc(p.name || '')},<br><br>Thank you for your message. Our team is reviewing it and will get back to you very soon.`}</p>
    <p style="font-size:16px;line-height:1.6;color:#cfc8bb">${fr ? 'Besoin d’une réponse immédiate ? Écrivez-nous sur WhatsApp' : 'Need an immediate answer? Message us on WhatsApp'} : <a style="color:#f39200" href="https://wa.me/237699902879">+237 699 90 28 79</a></p>
    <p style="font-size:14px;color:#8e877c;margin-top:32px">Notice International — 7X faites-vous écouter<br>Rue Palais Dika, Akwa — Douala, Cameroun</p></td></tr>
  </table></td></tr></table></body></html>`;
}

async function sendMail(to: string, subject: string, html: string, replyTo?: string) {
  const from = process.env.MAIL_FROM || 'Notice International <onboarding@resend.dev>';
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, reply_to: replyTo }),
    });
    return r.ok;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const nodemailer = await import('nodemailer');
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html, replyTo });
    return true;
  }
  return false;
}

/** Relais sans configuration (FormSubmit) — uniquement pour la notification interne. */
async function relayFormSubmit(to: string, subject: string, p: z.infer<typeof schema>) {
  const body: Record<string, string> = { _subject: subject, _template: 'table', _captcha: 'false', Nom: p.name, Email: p.email, Téléphone: p.phone, Type: p.kind };
  for (const [k, v] of Object.entries(p.data)) if (v !== '' && v !== null) body[LABELS[k] ?? k] = String(v);
  const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: SITE_URL, Referer: `${SITE_URL}/` },
    body: JSON.stringify(body),
  });
  return r.ok;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  // Robots : pot de miel rempli ou formulaire envoyé en moins de 2,5 s → succès silencieux
  if (parsed.hp || (parsed.elapsed > 0 && parsed.elapsed < 2500)) return NextResponse.json({ ok: true });
  if (limited(ip)) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let stored = false;
  if (hasSupabase) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ kind: parsed.kind, locale: parsed.locale, name: parsed.name || null, email: parsed.email, phone: parsed.phone || null, data: parsed.data }),
    }).catch(() => null);
    stored = !!r?.ok;
  }

  const to = process.env.CONTACT_TO || 'contact@noticeinternational.com';
  const when = typeof parsed.data.when === 'string' ? ` — ${parsed.data.when}` : '';
  const subject = `[Site] ${TITLES[parsed.kind]}${parsed.name ? ` · ${parsed.name}` : ''}${when}`;
  let mailed = false;
  // DISABLE_MAIL=1 : environnement de test, aucun e-mail n'est envoyé (la demande reste enregistrée en base)
  if (process.env.DISABLE_MAIL === '1') return stored ? NextResponse.json({ ok: true, mail: 'disabled' }) : NextResponse.json({ ok: false, error: 'delivery_failed' }, { status: 502 });
  try {
    mailed = await sendMail(to, subject, emailHtml(parsed.kind, parsed), parsed.email);
    if (mailed && parsed.kind !== 'newsletter') {
      await sendMail(parsed.email, parsed.locale === 'fr' ? 'Notice International — nous avons bien reçu votre demande' : 'Notice International — we received your request', confirmationHtml(parsed)).catch(() => false);
    }
    if (!mailed) mailed = await relayFormSubmit(to, subject, parsed);
  } catch {
    mailed = false;
  }

  if (!stored && !mailed) return NextResponse.json({ ok: false, error: 'delivery_failed' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
