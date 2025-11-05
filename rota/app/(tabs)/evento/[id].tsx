import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Evento } from '@/types';

// Dados dos eventos (simular banco de dados)
const eventosData: Record<string, { evento: Evento; conteudo: string; imagem: string }> = {
  '1': {
    evento: {
      id: '1',
      titulo: 'Festival de Verão de Maricá',
      data: '20 de Janeiro, 2024',
      horario: '14:00 - 22:00',
      local: 'Orla de Itaipuaçu',
      descricao: 'Festival com apresentações culturais, comidas típicas e artesanato local na orla da cidade.',
      tipo: 'Turismo',
    },
    imagem: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop',
    conteudo: `O Festival de Verão de Maricá promete agitar a orla de Itaipuaçu neste fim de semana. O evento terá início na sexta-feira, dia 20 de janeiro, às 14h, e se estende até domingo às 22h, com uma programação repleta de atrações culturais, gastronômicas e musicais.

A programação inclui shows com artistas locais e regionais, feira de artesanato com produtos da região, praça de alimentação com comidas típicas, e atividades esportivas na praia. O evento é totalmente gratuito e aberto ao público.

"Noite de sexta-feira teremos abertura com apresentação de grupos folclóricos e música ao vivo. No sábado, o dia começa com atividades esportivas na praia e continua com shows durante toda a tarde e noite. No domingo, fechamos com chave de ouro com apresentações de dança e música", disse o secretário de Turismo.

O festival terá estacionamento gratuito e segurança reforçada no local. A organização recomenda que os visitantes cheguem cedo para garantir os melhores lugares.`,
  },
  '2': {
    evento: {
      id: '2',
      titulo: 'Feira de Saúde e Bem-estar',
      data: '25 de Janeiro, 2024',
      horario: '08:00 - 17:00',
      local: 'Ginásio Municipal de Maricá',
      descricao: 'Exames gratuitos, vacinação e orientações sobre saúde para toda a população.',
      tipo: 'Saúde',
    },
    imagem: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
    conteudo: `A Secretaria de Saúde de Maricá realizará uma grande Feira de Saúde e Bem-estar no dia 25 de janeiro, das 8h às 17h, no Ginásio Municipal. O evento oferecerá diversos serviços gratuitos para a população.

Serão disponibilizados exames de glicemia, pressão arterial, IMC (Índice de Massa Corporal), teste de visão e orientações nutricionais. Também haverá vacinação contra gripe, tétano e outras doenças, além de distribuição de preservativos e material informativo sobre prevenção de doenças.

"Essa é uma oportunidade importante para a população cuidar da saúde. Todos os serviços são gratuitos e não é necessário agendamento", destacou o secretário de Saúde.

Profissionais de saúde estarão disponíveis para tirar dúvidas e orientar sobre hábitos saudáveis, prevenção de doenças e cuidados com a saúde em geral.`,
  },
  '3': {
    evento: {
      id: '3',
      titulo: 'Workshop de Empreendedorismo',
      data: '27 de Janeiro, 2024',
      horario: '09:00 - 12:00',
      local: 'Centro de Convenções de Maricá',
      descricao: 'Palestras e oficinas para empreendedores e pequenos negócios da região.',
      tipo: 'Educação',
    },
    imagem: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=400&fit=crop',
    conteudo: `A Secretaria de Desenvolvimento Econômico de Maricá promove um Workshop de Empreendedorismo no dia 27 de janeiro, das 9h às 12h, no Centro de Convenções. O evento é voltado para empreendedores, micro e pequenos empresários da região.

O workshop abordará temas como: planejamento financeiro, gestão de pessoas, marketing digital, inovação e sustentabilidade nos negócios. Haverá palestras com especialistas e oficinas práticas.

"Nosso objetivo é capacitar os empreendedores locais para que possam desenvolver seus negócios de forma mais eficiente e sustentável", disse o secretário de Desenvolvimento Econômico.

As inscrições são gratuitas e podem ser feitas pelo aplicativo Maricá Conecta ou presencialmente na Secretaria de Desenvolvimento Econômico. Vagas limitadas!`,
  },
  '4': {
    evento: {
      id: '4',
      titulo: 'Caminhada Ecológica na Lagoa de Araçatiba',
      data: '28 de Janeiro, 2024',
      horario: '07:00 - 10:00',
      local: 'Lagoa de Araçatiba',
      descricao: 'Caminhada ecológica com conscientização ambiental na bela lagoa de Araçatiba.',
      tipo: 'Meio Ambiente',
    },
    imagem: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    conteudo: `A Secretaria de Meio Ambiente de Maricá organiza uma Caminhada Ecológica na Lagoa de Araçatiba no dia 28 de janeiro, das 7h às 10h. O evento visa promover a conscientização ambiental e a prática de atividades físicas ao ar livre.

A caminhada terá aproximadamente 5km de percurso ao redor da lagoa, com paradas para observação da fauna e flora local. Durante o percurso, haverá atividades educativas sobre preservação ambiental e a importância das lagoas para o ecossistema de Maricá.

"Essa é uma oportunidade de unir atividade física com educação ambiental. Vamos mostrar a importância de preservar nossas lagoas", destacou o secretário de Meio Ambiente.

O evento é gratuito e aberto a todas as idades. Recomenda-se usar roupas confortáveis, tênis e levar água. Haverá pontos de hidratação ao longo do percurso.`,
  },
  '5': {
    evento: {
      id: '5',
      titulo: 'Festival de Música na Praia',
      data: '02 de Fevereiro, 2024',
      horario: '18:00 - 23:00',
      local: 'Praia de Itaipuaçu',
      descricao: 'Show com artistas locais e nacionais na praia mais famosa de Maricá.',
      tipo: 'Cultura',
    },
    imagem: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
    conteudo: `O Festival de Música na Praia de Itaipuaçu será realizado no dia 2 de fevereiro, das 18h às 23h. O evento contará com apresentações de artistas locais e nacionais, em um palco montado na areia da praia.

A programação inclui diversos estilos musicais: MPB, samba, rock, pop e música eletrônica. O evento terá iluminação especial e estrutura de som de alta qualidade para proporcionar uma experiência única aos participantes.

"Será uma noite mágica na praia. A música, o mar e a lua cheia vão criar uma atmosfera especial", disse o secretário de Cultura.

O evento é gratuito e terá estrutura de segurança, banheiros químicos e praça de alimentação. Recomenda-se chegar cedo para garantir os melhores lugares. Proibido levar bebidas alcoólicas.`,
  },
};

export default function EventoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const eventoData = id ? eventosData[id] : null;

  if (!eventoData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Evento não encontrado</Text>
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => router.back()}>
          <Text style={styles.botaoTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { evento, conteudo, imagem } = eventoData;

  const getTipoColor = (tipo: Evento['tipo']): string => {
    const cores: Record<Evento['tipo'], string> = {
      'Cultura': '#9B59B6',
      'Saúde': '#E74C3C',
      'Educação': '#3498DB',
      'Meio Ambiente': '#27AE60',
      'Esporte': '#F39C12',
      'Turismo': '#1ABC9C',
    };
    return cores[tipo] || '#0066CC';
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: imagem }} style={styles.imagem} />

      <View style={styles.content}>
        <LinearGradient
          colors={[getTipoColor(evento.tipo), getTipoColor(evento.tipo) + '80']}
          style={styles.categoriaContainer}
        >
          <View style={styles.categoriaContent}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.categoria}>{evento.tipo}</Text>
          </View>
        </LinearGradient>

        <Text style={styles.titulo}>{evento.titulo}</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={24} color="#0066CC" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data</Text>
              <Text style={styles.infoValue}>{evento.data}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={24} color="#0066CC" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Horário</Text>
              <Text style={styles.infoValue}>{evento.horario}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="location-outline" size={24} color="#0066CC" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Local</Text>
              <Text style={styles.infoValue}>{evento.local}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.descricao}>{evento.descricao}</Text>

        <Text style={styles.conteudo}>{conteudo}</Text>

        <View style={styles.acoesContainer}>
          <TouchableOpacity style={styles.acao}>
            <Ionicons name="share-outline" size={20} color="#0066CC" />
            <Text style={styles.acaoTexto}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acao}>
            <Ionicons name="calendar-outline" size={20} color="#0066CC" />
            <Text style={styles.acaoTexto}>Adicionar ao Calendário</Text>
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
    marginTop: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoriaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoria: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    lineHeight: 36,
  },
  infoContainer: {
    marginBottom: 24,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 20,
  },
  descricao: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    lineHeight: 26,
    marginBottom: 16,
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

