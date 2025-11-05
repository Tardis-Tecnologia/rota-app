import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Noticia } from '@/types';

// Dados das notícias (simular banco de dados)
const noticiasData: Record<string, { noticia: Noticia; conteudo: string }> = {
  '1': {
    noticia: {
      id: '1',
      titulo: 'Prefeitura de Maricá anuncia novas obras de infraestrutura',
      resumo: 'Investimento de R$ 10 milhões será destinado para melhorias em ruas e avenidas dos principais bairros da cidade...',
      imagem: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=400&fit=crop',
      data: '15 de Janeiro, 2024',
      categoria: 'Infraestrutura',
    },
    conteudo: `A Prefeitura de Maricá anunciou hoje um investimento de R$ 10 milhões em obras de infraestrutura urbana. O projeto contempla a pavimentação e melhorias em ruas e avenidas dos principais bairros da cidade, incluindo Itaipuaçu, Centro e São José do Imbassaí.

O prefeito destacou que essas obras são parte do programa de desenvolvimento urbano que visa melhorar a qualidade de vida dos moradores e atrair novos investimentos para a região.

"Este é um investimento importante para o futuro de Maricá. Estamos priorizando a infraestrutura urbana para garantir que nossa cidade continue crescendo de forma sustentável", afirmou o prefeito.

As obras terão início já no próximo mês e devem ser concluídas em até 12 meses. Durante o período de execução, haverá alterações no trânsito em algumas vias, mas a prefeitura garante que fará o menor impacto possível na circulação dos moradores.

Os moradores poderão acompanhar o andamento das obras através do aplicativo Maricá Conecta e também pelo site da prefeitura.`,
  },
  '2': {
    noticia: {
      id: '2',
      titulo: 'Programa de saúde ganha novos postos em Maricá',
      resumo: 'Três novos postos de saúde serão inaugurados este mês para melhorar o atendimento na região...',
      imagem: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
      data: '14 de Janeiro, 2024',
      categoria: 'Saúde',
    },
    conteudo: `A Secretaria de Saúde de Maricá anunciou a inauguração de três novos postos de saúde este mês, ampliando significativamente o atendimento à população. Os novos equipamentos serão instalados nos bairros de Itaipuaçu, Centro e São José do Imbassaí.

Cada unidade contará com consultórios médicos, sala de vacinação, farmácia básica e atendimento de enfermagem. O objetivo é reduzir o tempo de espera e melhorar o acesso aos serviços de saúde pública.

"Essa é uma conquista importante para a população de Maricá. Com esses novos postos, vamos poder atender mais pessoas e reduzir a sobrecarga das unidades existentes", destacou o secretário de Saúde.

Os novos postos começarão a funcionar já na próxima semana, com horário de atendimento das 7h às 17h, de segunda a sexta-feira.`,
  },
  '3': {
    noticia: {
      id: '3',
      titulo: 'Festival de Verão de Maricá acontece neste fim de semana',
      resumo: 'Evento contará com apresentações musicais na orla, feira de artesanato e comidas típicas...',
      imagem: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop',
      data: '13 de Janeiro, 2024',
      categoria: 'Turismo',
    },
    conteudo: `O Festival de Verão de Maricá promete agitar a orla de Itaipuaçu neste fim de semana. O evento terá início na sexta-feira e se estende até domingo, com uma programação repleta de atrações culturais, gastronômicas e musicais.

A programação inclui shows com artistas locais e regionais, feira de artesanato, praça de alimentação com comidas típicas, e atividades esportivas na praia. O evento é totalmente gratuito e aberto ao público.

"Esperamos receber milhares de pessoas neste festival. É uma oportunidade de valorizar nossa cultura e promover o turismo em Maricá", disse o secretário de Turismo.

O festival começa na sexta-feira às 18h e vai até domingo às 22h. Haverá estacionamento gratuito e segurança reforçada no local.`,
  },
  '4': {
    noticia: {
      id: '4',
      titulo: 'Novas vagas para cursos profissionalizantes em Maricá',
      resumo: 'Inscrições abertas para cursos gratuitos na área de turismo, tecnologia e sustentabilidade...',
      imagem: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
      data: '12 de Janeiro, 2024',
      categoria: 'Educação',
    },
    conteudo: `A Secretaria de Educação de Maricá está com inscrições abertas para novos cursos profissionalizantes gratuitos. São ofertadas 500 vagas em diversas áreas, incluindo turismo, tecnologia da informação e sustentabilidade.

Os cursos têm duração de 3 a 6 meses e incluem certificação reconhecida pelo mercado de trabalho. As aulas serão presenciais, no Centro de Formação Profissional de Maricá.

"Essa é uma oportunidade única para quem quer se qualificar e entrar no mercado de trabalho. Os cursos são totalmente gratuitos e com professores qualificados", destacou a secretária de Educação.

As inscrições podem ser feitas pelo aplicativo Maricá Conecta ou presencialmente na Secretaria de Educação, até o dia 31 de janeiro.`,
  },
  '5': {
    noticia: {
      id: '5',
      titulo: 'Maricá investe em sustentabilidade com novos projetos ambientais',
      resumo: 'Programa de preservação das lagoas e praias recebe investimento de R$ 3 milhões...',
      imagem: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      data: '11 de Janeiro, 2024',
      categoria: 'Meio Ambiente',
    },
    conteudo: `A Prefeitura de Maricá lançou um novo programa de preservação ambiental com investimento de R$ 3 milhões. O projeto visa proteger as lagoas e praias da cidade, além de promover educação ambiental.

O programa inclui limpeza periódica das lagoas, monitoramento da qualidade da água, plantio de árvores nativas e campanhas de conscientização sobre preservação do meio ambiente.

"Maricá tem um patrimônio natural incrível com suas lagoas e praias. É nosso dever preservar esse tesouro para as futuras gerações", afirmou o prefeito.

As ações começam já neste mês, com a primeira etapa de limpeza das lagoas de Araçatiba e da Barra.`,
  },
  '6': {
    noticia: {
      id: '6',
      titulo: 'Centro Esportivo de Maricá será inaugurado em fevereiro',
      resumo: 'Novo espaço contará com quadras, piscina e área de ginástica para toda a população...',
      imagem: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
      data: '10 de Janeiro, 2024',
      categoria: 'Esporte',
    },
    conteudo: `O novo Centro Esportivo de Maricá será inaugurado no início de fevereiro. O complexo esportivo contará com duas quadras poliesportivas cobertas, piscina semiolímpica, academia de ginástica e campo de futebol.

O espaço será aberto ao público com atividades gratuitas e pagas, além de abrigar escolinhas de esportes para crianças e jovens. A inauguração está marcada para o dia 5 de fevereiro.

"Este é um investimento importante para promover o esporte e a qualidade de vida em Maricá. O centro estará aberto para toda a população", disse o secretário de Esportes.

As inscrições para as atividades já podem ser feitas pelo aplicativo Maricá Conecta ou presencialmente no centro, a partir da próxima semana.`,
  },
};

export default function NoticiaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const noticiaData = id ? noticiasData[id] : null;

  if (!noticiaData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Notícia não encontrada</Text>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
          <Text style={styles.botaoTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { noticia, conteudo } = noticiaData;

  return (
    <ScrollView style={styles.container}>
        <Image source={{ uri: noticia.imagem }} style={styles.imagem} />

      <View style={styles.content}>
        <View style={styles.categoriaContainer}>
          <Text style={styles.categoria}>{noticia.categoria}</Text>
        </View>

        <Text style={styles.titulo}>{noticia.titulo}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{noticia.data}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>5 min de leitura</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.conteudo}>{conteudo}</Text>

        <View style={styles.acoesContainer}>
          <TouchableOpacity style={styles.acao}>
            <Ionicons name="share-outline" size={20} color="#0066CC" />
            <Text style={styles.acaoTexto}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acao}>
            <Ionicons name="bookmark-outline" size={20} color="#0066CC" />
            <Text style={styles.acaoTexto}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  botaoVoltar: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imagem: {
    width: '100%',
    height: 300,
    backgroundColor: '#ddd',
  },
  content: {
    padding: 20,
  },
  categoriaContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#0066CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoria: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 36,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 20,
  },
  conteudo: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    marginBottom: 30,
  },
  acoesContainer: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acaoTexto: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
});

