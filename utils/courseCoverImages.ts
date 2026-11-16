/** Capas ilustrativas por tema do curso (quando a API não envia imageId/imageUrl). */
const BY_TITLE: Record<string, string> = {
  'informática básica':
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=70',
  'excel profissional':
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&auto=format&fit=crop&q=70',
  'introdução à programação':
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=900&auto=format&fit=crop&q=70',
  'inglês básico':
    'https://images.unsplash.com/photo-1456513080800-7d93dbe9fce5?w=900&auto=format&fit=crop&q=70',
  'assistente administrativo':
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&auto=format&fit=crop&q=70',
  empreendedorismo:
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&auto=format&fit=crop&q=70',
  'gastronomia básica':
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&auto=format&fit=crop&q=70',
  'marketing digital':
    'https://images.unsplash.com/photo-1432888622747-4eb9a8efebc9?w=900&auto=format&fit=crop&q=70',
  'cuidador de idosos':
    'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=900&auto=format&fit=crop&q=70',
  'eletricista predial':
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&auto=format&fit=crop&q=70',
};

const BY_KEYWORD: { match: RegExp; url: string }[] = [
  {
    match: /informa|comput|excel|programa|python|tecnolog|digital|marketing/i,
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=70',
  },
  {
    match: /ingl[eê]s|idioma|espanhol|franc/i,
    url: 'https://images.unsplash.com/photo-1456513080800-7d93dbe9fce5?w=900&auto=format&fit=crop&q=70',
  },
  {
    match: /gastro|culin|cozinh|alimento/i,
    url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&auto=format&fit=crop&q=70',
  },
  {
    match: /eletric|obra|constru|pedreir|encan/i,
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&auto=format&fit=crop&q=70',
  },
  {
    match: /cuidador|sa[uú]de|idoso|enferm/i,
    url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=900&auto=format&fit=crop&q=70',
  },
  {
    match: /administ|escrit[oó]rio|secretaria/i,
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&auto=format&fit=crop&q=70',
  },
  {
    match: /empreend|neg[oó]cio|mei/i,
    url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&auto=format&fit=crop&q=70',
  },
];

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&auto=format&fit=crop&q=70';

export function resolveCourseCoverFallback(
  title?: string | null,
  category?: string | null,
): string {
  const key = (title || '').trim().toLowerCase();
  if (key && BY_TITLE[key]) return BY_TITLE[key];
  const hay = `${title || ''} ${category || ''}`;
  for (const item of BY_KEYWORD) {
    if (item.match.test(hay)) return item.url;
  }
  return DEFAULT_COVER;
}
