import { cn } from '@/lib/utils';

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  fit?: 'cover' | 'contain';
};

/** Image responsive : variantes WebP pré-générées (800/1600) pour les visuels du site, URL directe pour la médiathèque. */
export function Picture({ src, alt, className, imgClassName, sizes = '(min-width: 1024px) 50vw, 100vw', priority, fit = 'cover' }: Props) {
  const local = src.startsWith('/images/');
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={local ? `${src}-1600.webp` : src}
        srcSet={local ? `${src}-800.webp 800w, ${src}-1600.webp 1600w` : undefined}
        sizes={local ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('h-full w-full', fit === 'cover' ? 'object-cover' : 'object-contain', imgClassName)}
      />
    </div>
  );
}

export const imgUrl = (src: string, size: 800 | 1600 = 1600) => (src.startsWith('/images/') ? `${src}-${size}.webp` : src);
