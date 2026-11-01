import { getContent } from '@/lib/content';
import { NotFoundView } from '@/components/sections/NotFoundView';

export default async function NotFound() {
  const [fr, en] = await Promise.all([getContent('fr'), getContent('en')]);
  return <NotFoundView texts={{ fr: fr.notFound, en: en.notFound }} />;
}
