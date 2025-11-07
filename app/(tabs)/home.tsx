import CityAlerts from '@/components/CityAlerts';
import EventCarousel from '@/components/EventCarousel';
import Header from '@/components/Header';
import NewsCarousel from '@/components/NewsCarousel';
import NewsPosts from '@/components/NewsPosts';
import { AppColors } from '@/constants/theme';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet, Text, View
} from 'react-native';

export default function NoticiasScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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

