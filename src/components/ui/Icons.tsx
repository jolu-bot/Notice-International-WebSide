import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 18): SVGProps<SVGSVGElement> => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true });

export const ArrowRight = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const ArrowUpRight = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>);
export const ArrowLeft = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>);
export const Plus = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const Close = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Play = ({ size, ...p }: P) => (<svg {...base(size)} {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>);
export const Phone = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>);
export const Mail = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
export const Pin = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const Clock = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const Calendar = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>);
export const Check = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const Video = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="2.5" y="6" width="13" height="12" rx="2" /><path d="m15.5 10 6-3.5v11l-6-3.5" /></svg>);
export const Building = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 21V5l8-3v19M12 8h8v13M8 7h.01M8 11h.01M8 15h.01M16 12h.01M16 16h.01M2 21h20" /></svg>);
export const UserLock = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="10" cy="8" r="4" /><path d="M2.5 21a7.5 7.5 0 0 1 11.2-6.5" /><rect x="14.5" y="15.5" width="7" height="5.5" rx="1.2" /><path d="M16 15.5v-1.6a2 2 0 0 1 4 0v1.6" /></svg>);
export const Send = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M21.5 2.5 10.5 13.5M21.5 2.5l-7 19-4-8-8-4 19-7Z" /></svg>);
export const Mic = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" /></svg>);
export const Refresh = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>);
export const Briefcase = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></svg>);

export const WhatsApp = ({ size = 24, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm0-21.6A11.8 11.8 0 0 0 1.8 18l-1.7 6 6.2-1.6A11.8 11.8 0 1 0 12 .2Z" />
  </svg>
);
export const Facebook = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4Z" /></svg>
);
export const Instagram = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
);
export const XLogo = ({ size = 18, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5Z" /></svg>
);
export const TikTok = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 5 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6Z" /></svg>
);
export const LinkedIn = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M6.9 21H3.3V9h3.6v12ZM5.1 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM21 21h-3.6v-5.8c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1V21H9.6V9h3.4v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5V21Z" /></svg>
);
export const YouTube = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z" /></svg>
);
