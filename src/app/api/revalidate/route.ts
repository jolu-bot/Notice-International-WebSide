import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '@/lib/site';
import { clientIp, rateLimited, sameOrigin } from '@/lib/guard';

/** Appelé par l'espace d'administration après chaque enregistrement : publie immédiatement les contenus. */
export async function POST(req: NextRequest) {
  if (!hasSupabase) return NextResponse.json({ ok: false }, { status: 503 });
  if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  if (rateLimited(`reval:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_editor`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  });
  if (!r.ok || (await r.json()) !== true) return NextResponse.json({ ok: false }, { status: 403 });

  revalidateTag('content', { expire: 0 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
