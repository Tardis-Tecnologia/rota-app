import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type JobType = 'Remoto' | 'Presencial' | 'Híbrido';
export type ContractType = 'CLT' | 'Estágio' | 'Jovem Aprendiz';

export type JobCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  contractType?: ContractType;
  salary: string;
  image: string;
  distance: number;
  tags?: string[];
  /** Descrição da vaga (Visão Geral) */
  description?: string;
  /** Requisitos da vaga (O que você precisa) */
  requirements?: string[];
};

export const jobsNearBy: JobCard[] = [
  {
    id: 'job-0',
    title: 'Analista de Sistemas Pleno',
    company: 'RIOTECH HUB',
    location: 'Porto Maravilha, RJ',
    type: 'Híbrido',
    contractType: 'CLT',
    salary: 'R$ 7.500',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&auto=format&fit=crop',
    distance: 0.3,
    tags: ['TECH', 'HÍBRIDO'],
    description: 'Buscamos um desenvolvedor apaixonado por inovação para atuar em projetos de grande escala com React e TypeScript.',
    requirements: ['3+ anos com React', 'Experiência com TypeScript', 'Trabalho em equipe'],
  },
  {
    id: 'job-1',
    title: 'Atendente de Padaria',
    company: 'Padaria Pão Dourado',
    location: 'Centro',
    type: 'Presencial',
    contractType: 'CLT',
    salary: 'R$ 1.800',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop',
    distance: 0.5,
    tags: ['VAREJO'],
    description: 'Procuramos pessoa dedicada para atendimento ao cliente, organização do balcão e apoio na produção.',
    requirements: ['Boa comunicação', 'Disponibilidade para horário comercial', 'Proatividade'],
  },
  {
    id: 'job-2',
    title: 'Auxiliar Administrativo',
    company: 'Prefeitura de Maricá',
    location: 'Centro',
    type: 'Presencial',
    contractType: 'Estágio',
    salary: 'R$ 2.200',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
    distance: 0.8,
    tags: ['ADMINISTRATIVO'],
    description: 'Estágio para estudantes de Administração ou áreas afins. Atuação em rotinas administrativas e atendimento.',
    requirements: ['Cursando ensino superior', 'Conhecimento em Pacote Office', 'Organização'],
  },
  {
    id: 'job-3',
    title: 'Vendedor(a) de Loja',
    company: 'Varejo Fashion',
    location: 'Shopping Maricá',
    type: 'Presencial',
    contractType: 'Jovem Aprendiz',
    salary: 'R$ 2.200 + Com.',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop',
    distance: 1.2,
    tags: ['VENDAS'],
    description: 'Vaga para Jovem Aprendiz. Aprendizado em vendas, atendimento e operação de loja no varejo de moda.',
    requirements: ['Idade entre 14 e 24 anos', 'Ensino fundamental ou médio', 'Boa comunicação'],
  },
  {
    id: 'job-4',
    title: 'Desenvolvedor(a) Frontend',
    company: 'Inova Web',
    location: 'Itaipuaçu',
    type: 'Remoto',
    contractType: 'CLT',
    salary: 'R$ 5.500',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&auto=format&fit=crop',
    distance: 1.5,
    tags: ['TECH', 'REMOTO'],
    description: 'Desenvolvimento de interfaces web modernas em regime 100% remoto. Projetos com React e design system próprio.',
    requirements: ['2+ anos com React/Next.js', 'HTML, CSS e JavaScript', 'Experiência com Git'],
  },
  {
    id: 'job-5',
    title: 'Analista de Marketing Digital',
    company: 'TechSolutions',
    location: 'Ponta Negra',
    type: 'Híbrido',
    contractType: 'CLT',
    salary: 'R$ 4.500',
    image: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&auto=format&fit=crop',
    distance: 2.0,
    tags: ['MARKETING', 'HÍBRIDO'],
    description: 'Atuação em campanhas digitais, métricas e redes sociais. Ambiente dinâmico e criativo.',
    requirements: ['Experiência com redes sociais', 'Meta Ads ou Google Ads', 'Análise de dados'],
  },
  {
    id: 'job-6',
    title: 'Garçom/Garçonete',
    company: 'Restaurante Sabor da Terra',
    location: 'Araçatiba',
    type: 'Presencial',
    contractType: 'Jovem Aprendiz',
    salary: 'R$ 1.600 + Gorjetas',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&auto=format&fit=crop',
    distance: 2.3,
    tags: ['ALIMENTAÇÃO'],
    description: 'Atendimento em mesas, anotações de pedidos e serviço com qualidade em ambiente de restaurante.',
    requirements: ['Boa apresentação', 'Agilidade e cordialidade', 'Disponibilidade para fins de semana'],
  },
  {
    id: 'job-7',
    title: 'Recepcionista Bilíngue',
    company: 'Hotel Maricá Beach',
    location: 'Barra de Maricá',
    type: 'Presencial',
    contractType: 'CLT',
    salary: 'R$ 3.000',
    image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=200&auto=format&fit=crop',
    distance: 3.1,
    tags: ['TURISMO'],
    description: 'Recepção e atendimento a hóspedes em português e inglês. Check-in, check-out e informações turísticas.',
    requirements: ['Fluência em inglês', 'Pacote Office', 'Boa comunicação e postura'],
  },
  {
    id: 'job-8',
    title: 'Designer Gráfico',
    company: 'Agência Criativa',
    location: 'Inoã',
    type: 'Híbrido',
    contractType: 'CLT',
    salary: 'R$ 3.800',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&auto=format&fit=crop',
    distance: 3.5,
    tags: ['DESIGN', 'HÍBRIDO'],
    description: 'Criação de peças para redes sociais, materiais impressos e identidade visual para diversos clientes.',
    requirements: ['Domínio de Illustrator e Photoshop', 'Noções de edição de vídeo', 'Portfólio'],
  },
  {
    id: 'job-9',
    title: 'Cuidador(a) de Idosos',
    company: 'Casa de Repouso Vida Plena',
    location: 'São José do Imbassaí',
    type: 'Presencial',
    contractType: 'CLT',
    salary: 'R$ 2.000',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=200&auto=format&fit=crop',
    distance: 4.2,
    tags: ['SAÚDE'],
    description: 'Cuidado diário aos residentes: higiene, medicação, alimentação e acompanhamento, com respeito e empatia.',
    requirements: ['Experiência com idosos', 'Paciência e empatia', 'Disponibilidade para escala'],
  },
  {
    id: 'job-10',
    title: 'Assistente de RH',
    company: 'Grupo Empresarial Maricá',
    location: 'Jardim Atlântico',
    type: 'Presencial',
    contractType: 'CLT',
    salary: 'R$ 2.800',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop',
    distance: 4.8,
    tags: ['RH'],
    description: 'Apoio em admissões, folha de pagamento, benefícios e rotinas de departamento pessoal.',
    requirements: ['Conhecimento em eSocial', 'Pacote Office', 'Organização e sigilo'],
  },
] as JobCard[];

// Ordena por proximidade
const sortedJobs = [...jobsNearBy].sort((a, b) => a.distance - b.distance);

const typeStyles = {
  Remoto: { bg: '#DCFCE7', text: '#166534' },
  Presencial: { bg: '#DBEAFE', text: '#1E40AF' },
  Híbrido: { bg: '#FEF3C7', text: '#92400E' },
} as const;

type JobCategoryId = 'todos' | 'clt' | 'jovem-aprendiz' | 'estagio';

function filterJobsByCategory(jobs: JobCard[], categoryId: JobCategoryId): JobCard[] {
  if (categoryId === 'todos') return jobs;
  const map: Record<JobCategoryId, ContractType | null> = {
    todos: null,
    clt: 'CLT',
    'jovem-aprendiz': 'Jovem Aprendiz',
    estagio: 'Estágio',
  };
  const contract = map[categoryId];
  return contract ? jobs.filter((j) => j.contractType === contract) : jobs;
}

/** Minúsculas e sem acento, para "tecnico" achar "Técnico". */
function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Busca por profissão: procura no cargo, empresa, tags e descrição da vaga. */
function filterJobsBySearch(jobs: JobCard[], query: string): JobCard[] {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return jobs;
  return jobs.filter((job) => {
    const haystack = normalizeSearch(
      [job.title, job.company, job.description ?? '', ...(job.tags ?? [])].join(' '),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

interface JobsOpportunitiesProps {
  variant?: 'carousel' | 'list';
  activeCategory?: JobCategoryId;
  /** Texto digitado no filtro de profissão (só na variante lista). */
  searchQuery?: string;
}

export default function JobsOpportunities({
  variant = 'carousel',
  activeCategory = 'todos',
  searchQuery = '',
}: JobsOpportunitiesProps) {
  const filteredForList = filterJobsBySearch(
    filterJobsByCategory(sortedJobs, activeCategory),
    searchQuery,
  );

  if (variant === 'list') {
    if (filteredForList.length === 0) {
      const query = searchQuery.trim();
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            {query ? `Nenhuma vaga encontrada para "${query}"` : 'Sem novas vagas no momento'}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.listContainer}>
        {filteredForList.map((job) => {
          const typeStyle = typeStyles[job.type];
          return (
            <View key={job.id} style={styles.listCard}>
              <Image source={{ uri: job.image }} style={styles.listCardImage} />
              <View style={styles.listCardContent}>
                <View style={styles.listCardHeader}>
                  <View style={styles.listCardTitleRow}>
                    <Text style={styles.listCardTitle} numberOfLines={2}>
                      {job.title}
                    </Text>
                    {job.contractType && (
                      <View style={styles.contractBadge}>
                        <Text style={styles.contractBadgeText}>{job.contractType}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.listCardCompany}>{job.company}</Text>
                </View>
                <View style={styles.listCardMeta}>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={AppColors.text.tertiary}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {job.location}
                    </Text>
                  </View>
                  <Text style={styles.listCardSalary}>{job.salary}</Text>
                </View>
                {job.tags && job.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {job.tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Pressable
                style={({ pressed }) => [styles.listCardArrow, pressed && styles.listCardArrowPressed]}
                onPress={() =>
                  router.push({
                    pathname: '/JobDetailTab',
                    params: { jobId: job.id },
                  })
                }
              >
                <Ionicons name="arrow-forward" size={20} color={AppColors.text.white} />
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Oportunidades Perto de Você</Text>
        <Pressable hitSlop={8} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Ver todas</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {sortedJobs.map((job) => {
          const typeStyle = typeStyles[job.type];
          return (
            <View key={job.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Image source={{ uri: job.image }} style={styles.cardImage} />
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {job.title}
                    </Text>
                    <Text style={styles.cardCompany}>{job.company}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={AppColors.text.tertiary}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>{job.location}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                    <Text style={[styles.typeText, { color: typeStyle.text }]}>{job.type}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.distanceText}>{job.distance} km de você</Text>
                  <Text style={styles.salaryText}>{job.salary}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 260;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: AppColors.text.secondary,
  },
  viewAllButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.accent,
  },
  cardsRow: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(15, 23, 42, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: AppColors.background.input,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
    flexShrink: 1,
  },
  cardCompany: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    flexShrink: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: AppColors.border.muted,
    paddingTop: 12,
  },
  distanceText: {
    fontSize: 12,
    color: AppColors.text.tertiary,
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.palette.teal.base,
    flexShrink: 0,
  },
  // List variant (vertical cards)
  listContainer: {
    gap: 12,
  },
  emptyStateContainer: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: AppColors.text.tertiary,
    textAlign: 'center',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background.default,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  listCardImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: AppColors.background.input,
  },
  listCardContent: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
    gap: 6,
  },
  listCardHeader: {
    gap: 2,
  },
  listCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text.secondary,
    flex: 1,
  },
  contractBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: AppColors.background.muted,
  },
  contractBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  listCardCompany: {
    fontSize: 13,
    color: AppColors.text.tertiary,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listCardSalary: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.background.lightBlue,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: AppColors.background.muted,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.text.tertiary,
  },
  listCardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background.darkBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  listCardArrowPressed: {
    opacity: 0.85,
  },
});

