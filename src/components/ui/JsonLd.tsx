/** Données structurées. `<` est échappé pour qu'un contenu édité ne puisse jamais fermer la balise script. */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/ /g, '\\u2028').replace(/ /g, '\\u2029');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
