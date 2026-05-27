import { Profile } from '@/types';

export const COMPANIES: Profile[] = [
  {
    id: 'company-1',
    type: 'COMPANY',
    name: 'Boteco Belmonte',
    categoryId: 'food',
    latitude: -22.9195,
    longitude: -42.817,
    address: 'Rua Barão do Flamengo, 32 — Flamengo, Rio de Janeiro',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&fit=crop',
    review: 112,
    about:
      'Boteco tradicional do Flamengo desde 1986. Ambiente descontraído, petiscos caseiros e drinks clássicos. Happy Hour todos os dias e feijoada aos domingos com música ao vivo.',
    serviceArea: 'Rua Barão do Flamengo, 32 — Flamengo, Rio de Janeiro',
    hours: 'Seg a Dom: 11h às 2h',
    phone: '(21) 2225-1234',
    email: 'contato@botecobelmonte.com.br',
    services: [
      { name: 'Caipirinha', description: 'Dose simples - dose dupla no Happy Hour', price: 'R$ 18,00' },
      { name: 'Chopp', description: '300 ml - gelado', price: 'R$ 12,00' },
      { name: 'Feijoada', description: 'Porção individual aos domingos', price: 'R$ 45,00' },
      { name: 'Empada', description: 'Carne, frango ou palmito', price: 'R$ 8,00' },
      { name: 'Porção batata frita', description: 'Serve 2 pessoas', price: 'R$ 22,00' },
    ],
    reviews: [
      { author: 'João S.', comment: 'Ambiente ótimo e caipirinha maravilhosa!', rating: 5 },
      { author: 'Maria L.', comment: 'Petiscos sempre fresquinhos. Recomendo as empadas.', rating: 5 },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&fit=crop',
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&fit=crop',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop',
    ],
    muralPosts: [
      {
        id: '1',
        timeAgo: 'HÁ 2H',
        text: 'Hoje é dia de Happy Hour! Dose dupla de caipirinha até as 20h.',
        imageUri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop',
        likes: 342,
      },
      {
        id: '2',
        timeAgo: 'HÁ 1 DIA',
        text: 'Nossas empadas acabaram de sair do forno! Corre que acaba rápido.',
        imageUri: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop',
        likes: 128,
      },
    ],
  },
  {
    id: 'company-2',
    type: 'COMPANY',
    name: 'Livraria da Travessa',
    categoryId: 'business',
    latitude: -22.9165,
    longitude: -42.8225,
    address: 'Rua Visconde de Pirajá, 572 — Ipanema, Rio de Janeiro',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&fit=crop',
    review: 256,
    about:
      'Livraria de referência no Rio com múltiplos endereços. Grande acervo de literatura nacional e estrangeira, clube do livro, cafeteria e programação cultural com autores.',
    serviceArea: 'Rua Visconde de Pirajá, 572 — Ipanema, Rio de Janeiro',
    hours: 'Seg a Dom: 9h às 22h',
    phone: '(21) 3208-0208',
    email: 'ipanema@travessa.com.br',
    services: [
      { name: 'Clube do livro(mensal)', description: 'Um livro por mês + 20% de desconto em outros', price: 'R$ 49,90' },
      { name: 'Café + bolo', description: 'Café da manhã na cafeteria', price: 'R$ 24,00' },
      { name: 'Encomenda de livros', description: 'Pedidos sob encomenda em até 7 dias', price: 'Sem custo' },
      { name: 'Evento/ sessão de autógrafos', description: 'Confira a programação na loja', price: 'Gratuito' },
    ],
    reviews: [
      { author: 'Ana C.', comment: 'Melhor livraria da cidade. Ambiente aconchegante.', rating: 5 },
      { author: 'Pedro M.', comment: 'Clube do livro vale muito a pena!', rating: 5 },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521586280430-9d172c970b5b?w=400&auto=format&fit=crop',
    ],
    muralPosts: [
      {
        id: '1',
        timeAgo: 'HÁ 5H',
        text: 'Novidade: clube do livro mensal com 20% de desconto em um título escolhido. Inscreva-se na loja.',
        imageUri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&auto=format&fit=crop',
        likes: 128,
      },
      {
        id: '2',
        timeAgo: 'HÁ 2 DIAS',
        text: 'Sessão de autógrafos com o autor de "Cidade dos Livros" no sábado às 16h. Entrada gratuita.',
        // imageUri: 'https://images.unsplash.com/photo-1521586280430-9d172c970b5b?w=400&auto=format&fit=crop',
        likes: 256,
      },
    ],
  },
];
