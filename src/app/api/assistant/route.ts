import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getContent, getSettings } from '@/lib/content';
import { clientIp, rateLimited, readJson, sameOrigin, tooLarge } from '@/lib/guard';
import { buildDocs, resolveAction, systemPrompt } from '@/lib/assistant/knowledge';
import { getPosts } from '@/lib/posts';
import { localReply, type Handoff } from '@/lib/assistant/engine';

export const runtime = 'nodejs';
export const maxDuration = 60;

const schema = z.object({
  locale: z.enum(['fr', 'en']).default('fr'),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(1500) })).min(1).max(30),
});

const HANDOFFS: Handoff[] = ['none', 'ceo', 'assistant', 'both'];
const META = '[[meta';

/** Position jusqu'à laquelle le texte peut être envoyé sans risquer de couper le bloc [[meta …]]. */
function safeCut(full: string) {
  const i = full.indexOf(META);
  if (i >= 0) return i;
  for (let k = Math.min(META.length, full.length); k > 0; k--) if (META.startsWith(full.slice(-k))) return full.length - k;
  return full.length;
}

function parseMeta(full: string): { actions: string[]; handoff: Handoff; suggestions: string[] } {
  const m = full.match(/\[\[meta\s*(\{[\s\S]*?\})\s*\]\]/);
  const empty = { actions: [], handoff: 'none' as Handoff, suggestions: [] };
  if (!m) return empty;
  try {
    const raw = JSON.parse(m[1]) as { actions?: unknown; handoff?: unknown; suggestions?: unknown };
    return {
      actions: Array.isArray(raw.actions) ? raw.actions.filter((a): a is string => typeof a === 'string').slice(0, 3) : [],
      handoff: HANDOFFS.includes(raw.handoff as Handoff) ? (raw.handoff as Handoff) : 'none',
      suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 60)).slice(0, 3) : [],
    };
  } catch {
    return empty;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  if (tooLarge(req, 60_000)) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 });
  const ip = clientIp(req);
  if (rateLimited(`echo:${ip}`, 15, 60_000) || rateLimited(`echo-h:${ip}`, 150, 60 * 60_000)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await readJson(req, 60_000));
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const history = body.messages.slice(-12);
  while (history.length && history[0].role !== 'user') history.shift();
  const last = history.at(-1);
  if (!last || last.role !== 'user') return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });

  const { locale } = body;
  const [c, s, posts] = await Promise.all([getContent(locale), getSettings(), getPosts(locale)]);
  const docs = buildDocs(locale, c, s, posts);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
      const finish = (meta: { actions: string[]; handoff: Handoff; suggestions: string[] }, source: 'ai' | 'local') => {
        const actions = meta.actions.map((id) => resolveAction(id, locale, c)).filter((a) => a !== null);
        send({ type: 'meta', actions, handoff: meta.handoff, suggestions: meta.suggestions, source });
      };
      const local = () => {
        const r = localReply(last.content, locale, c, s, docs);
        send({ type: 'text', value: r.text });
        finish(r, 'local');
      };

      try {
        if (!process.env.ANTHROPIC_API_KEY) { local(); return; }
        const client = new Anthropic();
        let full = '';
        let emitted = 0;
        const ai = client.beta.messages.stream({
          model: process.env.ASSISTANT_MODEL || 'claude-opus-5-5',
          max_tokens: 2048,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'low' },
          system: [{ type: 'text', text: systemPrompt(locale, c, s, docs), cache_control: { type: 'ephemeral' } }],
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }, { signal: req.signal, timeout: 45_000, maxRetries: 1 });

        for await (const ev of ai) {
          // Bascule vers le modèle de secours : le début de réponse est abandonné
          if (ev.type === 'content_block_start' && ev.content_block.type === 'fallback') { full = ''; emitted = 0; send({ type: 'reset' }); }
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
            full += ev.delta.text;
            const cut = safeCut(full);
            if (cut > emitted) { send({ type: 'text', value: full.slice(emitted, cut) }); emitted = cut; }
          }
        }
        const final = await ai.finalMessage();
        const metaAt = full.indexOf(META);
        const answer = (metaAt >= 0 ? full.slice(0, metaAt) : full).trimEnd();
        if (final.stop_reason === 'refusal' || !answer.trim()) {
          if (emitted) send({ type: 'reset' });
          local();
          return;
        }
        if (answer.length > emitted) send({ type: 'text', value: answer.slice(emitted) });
        finish(parseMeta(full), 'ai');
      } catch (err) {
        if (req.signal.aborted) return;
        if (err instanceof Anthropic.APIError) console.error('assistant: Claude API', err.status, err.message);
        else console.error('assistant:', err instanceof Error ? err.message : err);
        send({ type: 'reset' });
        local();
      } finally {
        try { controller.close(); } catch { /* flux déjà fermé */ }
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  });
}
