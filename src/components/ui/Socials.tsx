import type { Settings } from '@/content/settings';
import { cn, waLink } from '@/lib/utils';
import { Facebook, Instagram, LinkedIn, TikTok, WhatsApp, XLogo, YouTube } from './Icons';

export function Socials({ settings, className, size = 'md' }: { settings: Settings; className?: string; size?: 'md' | 'lg' }) {
  const s = settings.socials;
  const items = [
    { href: s.facebook, label: 'Facebook', Icon: Facebook },
    { href: s.instagram, label: 'Instagram', Icon: Instagram },
    { href: s.x, label: 'X (Twitter)', Icon: XLogo },
    { href: s.tiktok, label: 'TikTok', Icon: TikTok },
    { href: s.linkedin, label: 'LinkedIn', Icon: LinkedIn },
    { href: s.youtube, label: 'YouTube', Icon: YouTube },
    { href: settings.contact.whatsapp[0] ? waLink(settings.contact.whatsapp[0].number) : '', label: 'WhatsApp', Icon: WhatsApp },
  ].filter((i) => i.href);
  const dim = size === 'lg' ? 'h-14 w-14' : 'h-11 w-11';
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {items.map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            data-magnetic
            className={cn(dim, 'grid place-items-center rounded-full border border-[var(--line)] transition-colors duration-500 hover:border-transparent hover:bg-[var(--c-orange)] hover:text-[var(--c-ink)]')}
          >
            <Icon size={size === 'lg' ? 22 : 18} />
          </a>
        </li>
      ))}
    </ul>
  );
}
