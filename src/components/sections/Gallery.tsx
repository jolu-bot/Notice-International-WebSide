'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';
import { imgUrl } from '../ui/Picture';
import { ArrowLeft, ArrowRight, Close } from '../ui/Icons';

/** Galerie en mosaïque + visionneuse plein écran (clavier, glisser, compteur). */
export function Gallery({ images, alt, label }: { images: string[]; alt: string; label: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const touch = useRef(0);

  const go = useCallback((dir: number) => {
    setIndex((i) => (i === null ? i : (i + dir + images.length) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [index, go]);

  useEffect(() => {
    if (index !== null && imgRef.current) gsap.fromTo(imgRef.current, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
  }, [index]);
  useEffect(() => {
    if (index !== null && boxRef.current) gsap.fromTo(boxRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
  }, [index !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5" aria-label={label}>
        {images.map((src, i) => (
          <li key={src + i} className="break-inside-avoid" data-reveal>
            <button onClick={() => setIndex(i)} className="img-zoom group block w-full overflow-hidden rounded-[1.4rem]" data-cursor="+" aria-label={`${alt} — ${i + 1}/${images.length}`}>
              <img src={imgUrl(src, 800)} alt={`${alt} — ${i + 1}`} loading="lazy" decoding="async" className="w-full" />
            </button>
          </li>
        ))}
      </ul>
      {index !== null && (
        <div ref={boxRef} className="lightbox" role="dialog" aria-modal="true" aria-label={alt}
          onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
          <div className="flex items-center justify-between p-5">
            <span className="num text-lg">{String(index + 1).padStart(2, '0')} <span className="text-[var(--muted)]">/ {String(images.length).padStart(2, '0')}</span></span>
            <button className="lb-btn" onClick={() => setIndex(null)} aria-label="Fermer / Close"><Close size={22} /></button>
          </div>
          <div className="relative grid min-h-0 place-items-center px-4" onClick={(e) => { if (e.target === e.currentTarget) setIndex(null); }}>
            <img ref={imgRef} src={imgUrl(images[index])} alt={`${alt} — ${index + 1}`} className="max-h-full max-w-full rounded-xl object-contain" />
          </div>
          <div className="flex items-center justify-center gap-4 p-5">
            <button className="lb-btn" onClick={() => go(-1)} aria-label="Précédent / Previous"><ArrowLeft size={20} /></button>
            <div className="hidden max-w-[60vw] gap-2 overflow-x-auto md:flex">
              {images.map((src, i) => (
                <button key={i} onClick={() => setIndex(i)} className={cn('h-14 w-20 flex-none overflow-hidden rounded-lg border-2 transition-all', i === index ? 'border-[var(--c-orange)]' : 'border-transparent opacity-50 hover:opacity-100')} aria-label={String(i + 1)}>
                  <img src={imgUrl(src, 800)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            <button className="lb-btn" onClick={() => go(1)} aria-label="Suivant / Next"><ArrowRight size={20} /></button>
          </div>
        </div>
      )}
    </>
  );
}
