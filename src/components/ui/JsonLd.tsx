/** Données structurées. `<` est échappé pour qu'un contenu édité ne puisse jamais fermer la balise script. */
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const ESC = String.fromCharCode(92);

export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).split('<').join(ESC + 'u003c').split(LS).join(ESC + 'u2028').split(PS).join(ESC + 'u2029');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
