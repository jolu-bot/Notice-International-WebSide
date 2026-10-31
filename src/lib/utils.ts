export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Fusion profonde : les objets fusionnent, les tableaux et valeurs simples remplacent. */
export function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) return (override === undefined ? base : (override as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined || v === null) continue;
    const b = (base as Record<string, unknown>)[k];
    if (Array.isArray(b) && !Array.isArray(v)) continue; // garde-fou : type incompatible
    if (typeof b === 'string' && typeof v !== 'string') continue;
    out[k] = isPlainObject(b) ? deepMerge(b, v) : v;
  }
  return out as T;
}

/** Applique une transformation à toutes les chaînes d'un objet. */
export function mapStrings<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === 'string') return fn(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn)) as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = mapStrings(v, fn);
    return out as T;
  }
  return value;
}

/** Typographie française : espaces fines insécables avant : ; ! ? » et après «. */
export function frenchTypography(s: string): string {
  return s
    .replace(/ ([:;!?»])/g, ' $1')
    .replace(/« /g, '« ');
}

export function fillTokens(s: string, tokens: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (m, key) => (key in tokens ? String(tokens[key]) : m));
}

export function waLink(number: string, text?: string) {
  const n = number.replace(/\D/g, '');
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function pad2(n: number) {
  return n.toString().padStart(2, '0');
}
