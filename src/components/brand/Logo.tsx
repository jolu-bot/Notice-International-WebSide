import { FACETS, MARK, MOUTH, LOGO_VIEWBOX } from './logo-data';
import { cn } from '@/lib/utils';

const COLORS = { orange: 'var(--c-orange)', red: 'var(--c-red)', navy: 'var(--c-navy)', blue: 'var(--c-blue)' } as const;

type Props = {
  className?: string;
  title?: string;
  /** 'mark' : la bouche seule · 'full' : bouche + slogan en arc + nom */
  variant?: 'mark' | 'full';
  mouthColor?: string;
  sloganColor?: string;
};

/**
 * Logotype officiel reconstruit en vectoriel : chaque facette de la bouche est un tracé
 * indépendant (data-facet), ce qui permet de l'assembler, l'éclater ou la faire « parler ».
 */
export function Logo({ className, title = 'Notice International', variant = 'mark', mouthColor = '#fff', sloganColor = 'currentColor' }: Props) {
  const { w, h } = LOGO_VIEWBOX;
  const full = variant === 'full';
  return (
    <svg
      viewBox={full ? `-50 -10 ${w + 100} ${h + 300}` : `0 0 ${w} ${h}`}
      className={cn('ni-logo', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d={MOUTH} fill={mouthColor} data-mouth />
      <g data-facets>
        {FACETS.map((f, i) => (
          <path key={i} d={f.d} fill={COLORS[f.color]} data-facet={i} style={{ transformOrigin: `${f.cx}px ${f.cy}px` }} />
        ))}
      </g>
      <path d={MARK} fill="var(--c-navy)" data-mark />
      {full && (
        <>
          <defs>
            <path id="ni-arc" d={`M -30 ${h - 120} Q ${w / 2} ${h + 230} ${w + 30} ${h - 120}`} />
          </defs>
          <text fill={sloganColor} style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic', fontWeight: 600, fontSize: 64, letterSpacing: 1 }} data-slogan>
            <textPath href="#ni-arc" startOffset="50%" textAnchor="middle">
              7X faites-vous écouter
            </textPath>
          </text>
          <text x={w / 2} y={h + 268} textAnchor="middle" fill="var(--c-red)" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 76, letterSpacing: -1 }} data-wordmark>
            Notice International
          </text>
        </>
      )}
    </svg>
  );
}
