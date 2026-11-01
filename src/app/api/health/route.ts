import { NextResponse } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from '@/lib/site';

export const dynamic = 'force-dynamic';

/** État de santé (utilisé par la surveillance automatique) : le site répond et la base est joignable. */
export async function GET() {
  let database = false;
  if (hasSupabase) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/content?select=section&limit=1`, { headers: { apikey: SUPABASE_ANON_KEY }, cache: 'no-store', signal: AbortSignal.timeout(6000) });
      database = r.ok;
    } catch { database = false; }
  }
  return NextResponse.json({ ok: database, database, time: new Date().toISOString() }, { status: database ? 200 : 503 });
}
