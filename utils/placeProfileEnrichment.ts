import type { PlaceReview, PontoInteresse } from '@/types';

const ABOUT_BY_PLACE_TYPE: Record<string, string> = {
  restaurant:
    'Cardápio variado e atendimento no bairro. Confira horários no local e avalie sua visita pelo app.',
  fast_food:
    'Opções rápidas para o dia a dia. Ideal para uma parada rápida perto de você.',
  bakery:
    'Pães frescos e quitutes da região. Passe cedo para garantir os favoritos.',
  bar: 'Ponto de encontro do bairro. Ambiente descontraído para um happy hour.',
  cafe: 'Café e lanches em clima leve. Bom para trabalhar ou encontrar alguém.',
  pharmacy: 'Medicamentos e cuidados básicos próximos a você.',
  atm: 'Caixa eletrônico para saques e consultas rápidas.',
  market: 'Mercado de bairro com itens essenciais do dia a dia.',
  supermarket: 'Compras completas com variedade de marcas e ofertas.',
  gym: 'Espaço para treino e bem-estar. Confirme planos e horários no local.',
  park: 'Área verde para caminhar, relaxar e levar a família.',
  school: 'Instituição de ensino da região.',
  hotel: 'Hospedagem próxima. Consulte disponibilidade e tarifas no local.',
  hospital: 'Atendimento de saúde. Em emergência, ligue para o SAMU 192.',
  bank: 'Agência bancária para serviços presenciais.',
  shopping_center: 'Centro comercial com lojas, alimentação e serviços.',
  shopping: 'Espaço de compras e serviços na região.',
  gas_station: 'Abastecimento e conveniência na rota.',
  partner_stores:
    'Loja parceira do Rota — fale com o estabelecimento, veja promoções e peça indicação pelo app.',
  communities: 'Canal da comunidade no feed da cidade.',
};

const REVIEW_POOL: PlaceReview[] = [
  {
    author: 'Ana Souza',
    comment: 'Atendimento rápido e lugar limpo. Voltarei com certeza.',
    rating: 5,
    timeAgo: 'há 2 dias',
  },
  {
    author: 'Carlos Lima',
    comment: 'Bom custo-benefício. Fica fácil de achar pelo mapa.',
    rating: 4,
    timeAgo: 'há 1 semana',
  },
  {
    author: 'Juliana P.',
    comment: 'Ambiente agradável. Recomendo chegar um pouco mais cedo nos horários de pico.',
    rating: 4,
    timeAgo: 'há 3 semanas',
  },
];

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickReviews(pontoId: string): PlaceReview[] {
  const seed = hashSeed(pontoId);
  const first = REVIEW_POOL[seed % REVIEW_POOL.length];
  const second = REVIEW_POOL[(seed + 1) % REVIEW_POOL.length];
  if (first.author === second.author) return [first];
  return [first, second];
}

/** Completa o sheet do mapa com texto curto, nota e reviews quando a API não traz. */
export function enrichPlaceProfile(ponto: PontoInteresse): PontoInteresse {
  const placeType = ponto.placeType?.trim() || '';
  const about =
    ponto.about?.trim() ||
    ABOUT_BY_PLACE_TYPE[placeType] ||
    `Estabelecimento em destaque perto de você. Use “Como chegar” para ver o caminho no mapa do app.`;

  const rating =
    ponto.rating ??
    Number((3.6 + (hashSeed(ponto.id) % 14) / 10).toFixed(1));
  const userRatingsTotal =
    ponto.userRatingsTotal ?? 8 + (hashSeed(`${ponto.id}-n`) % 40);

  const reviews =
    ponto.reviews && ponto.reviews.length > 0 ? ponto.reviews : pickReviews(ponto.id);

  const photoUrls = [
    ...(ponto.photoUrls ?? []),
    ...(ponto.photoUrl ? [ponto.photoUrl] : []),
  ]
    .map((url) => url.trim())
    .filter((url, index, arr) => url.length > 0 && arr.indexOf(url) === index);

  return {
    ...ponto,
    about,
    rating,
    userRatingsTotal,
    reviews,
    photoUrl: photoUrls[0] || ponto.photoUrl,
    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
  };
}
