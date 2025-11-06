import AlertasCidade from '@/components/AlertasCidade';
import EventosCarousel from '@/components/EventosCarousel';
import Header from '@/components/Header';
import NovidadesCarousel from '@/components/NovidadesCarousel';
import PostsAlert from '@/components/PostsAlert';
import { AppColors } from '@/constants/theme';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
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
      <NovidadesCarousel />
      {/* Componente Alertas da Cidade */}
      <AlertasCidade />
      {/* Componente de Eventos (Carrossel) */}
      <EventosCarousel />
       {/* Componente de Posts (Alerta) */}
       <PostsAlert />
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
});

