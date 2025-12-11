import CityAlerts from '@/components/CityAlerts';
import EventCarousel from '@/components/EventCarousel';
import Header from '@/components/Header';
import JobSuggestionCard from '@/components/JobSuggestionCard';
import NewsCarousel from '@/components/NewsCarousel';
import NewsPosts from '@/components/NewsPosts';
import OpinionCard from '@/components/OpinionCard';
import Toast from '@/components/Toast';
import { AppColors } from '@/constants/theme';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet, Text, View
} from 'react-native';

export default function NoticiasScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showToast, setShowToast] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleVote = () => {
    // Sempre reinicia o toast com nova key para reiniciar a animação
    setShowToast(false);
    setToastKey((prev) => prev + 1);
    // Aguarda um frame para garantir que o estado foi atualizado
    setTimeout(() => {
      setShowToast(true);
    }, 50);
  };

  const ListHeader = () => (
    <View>
      {/* Componente Header */}
      <Header />
      {/* Componente Novidades (Carrossel) */}
      <NewsCarousel />
      {/* Componente Alertas da Cidade */}
      <CityAlerts />
      {/* Componente de Eventos (Carrossel) */}
      <OpinionCard onVote={handleVote} />
      {/* Jobs and Opportunities Card */}
      <JobSuggestionCard />
      <EventCarousel />
      <View>
      <Text style={styles.title}>Últimas Notícias</Text>
        {/* Componente de Posts (Alerta) */}
        <NewsPosts />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={ListHeader}
        // ListFooterComponent={<NoticiasList onRefresh={onRefresh} renderAsItems={true} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
      <Toast
        key={toastKey}
        message="+25 pontos por participar!"
        visible={showToast}
        type="success"
        duration={3000}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background.light,
  },
  contentContainer: {
    flexGrow: 1,
  },
  title: {
    marginLeft: 24,
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.text.secondary,
    marginBottom: 16,
  },
});

