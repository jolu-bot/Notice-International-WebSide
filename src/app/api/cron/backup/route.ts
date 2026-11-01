import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '@/lib/site';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Snapshot = Record<string, unknown[] | string>;

/**
 * Sauvegarde hebdomadaire (planifiée par Vercel, voir vercel.json) : instantané complet de la base
 * envoyé par e-mail en pièce jointe JSON. Protégée par CRON_SECRET (appel) et BACKUP_TOKEN (base).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  if (!hasSupabase || !process.env.BACKUP_TOKEN) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 });

  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/backup_snapshot`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_token: process.env.BACKUP_TOKEN }),
    cache: 'no-store',
  });
  if (!r.ok) {
    console.error('backup: instantané impossible', r.status, await r.text());
    return NextResponse.json({ ok: false, error: 'snapshot_failed' }, { status: 502 });
  }
  const snapshot = (await r.json()) as Snapshot;
  const json = JSON.stringify(snapshot, null, 2);
  const day = new Date().toISOString().slice(0, 10);
  const counts = Object.entries(snapshot).filter(([, v]) => Array.isArray(v)).map(([k, v]) => `<li><strong>${k}</strong> : ${(v as unknown[]).length}</li>`).join('');

  const to = process.env.BACKUP_TO || process.env.CONTACT_TO || 'contact@noticeinternational.com';
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, error: 'no_mailer', bytes: json.length }, { status: 503 });
  const mail = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Notice International <site@noticeinternational.com>',
      to: [to],
      subject: `Sauvegarde hebdomadaire du site — ${day}`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;color:#070a17"><h2 style="font-family:Georgia,serif;font-weight:400">Sauvegarde du site Notice International</h2>
        <p>Voici la copie complète de la base du site au ${day} (pièce jointe <em>.json</em>). Conservez ces e-mails dans un dossier dédié : en cas de problème, ils permettent de tout restaurer.</p>
        <ul>${counts}</ul><p style="color:#888;font-size:12px">Les images et vidéos de la médiathèque restent stockées chez Supabase ; la sauvegarde en contient la liste.</p></div>`,
      attachments: [{ filename: `sauvegarde-notice-international-${day}.json`, content: Buffer.from(json, 'utf-8').toString('base64') }],
    }),
  });
  if (!mail.ok) {
    console.error('backup: envoi impossible', mail.status, await mail.text());
    return NextResponse.json({ ok: false, error: 'mail_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, day, bytes: json.length });
}
