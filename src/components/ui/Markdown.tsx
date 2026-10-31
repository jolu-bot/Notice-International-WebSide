import { Fragment, type ReactNode } from 'react';

/** Rendu Markdown minimal et sûr (titres ##, listes -, paragraphes, **gras**, *italique*) — sans HTML brut. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? <strong key={i++}>{m[1]}</strong> : <em key={i++}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.split(/\r?\n/);
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(' '))}</p>);
    if (list.length) blocks.push(<ul key={blocks.length}>{list.map((li, j) => <li key={j}>{inline(li)}</li>)}</ul>);
    para = [];
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('## ')) { flush(); blocks.push(<h2 key={blocks.length}>{inline(line.slice(3))}</h2>); continue; }
    if (line.startsWith('- ')) { if (para.length) { const p = para; para = []; blocks.push(<p key={blocks.length}>{inline(p.join(' '))}</p>); } list.push(line.slice(2)); continue; }
    if (list.length) flush();
    para.push(line);
  }
  flush();
  return <div className={className}>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
