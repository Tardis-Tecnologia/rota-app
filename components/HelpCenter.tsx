import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { isComercioUser } from '@/utils/comercioAuth';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type HelpItem = {
  id: string;
  title: string;
  description: string;
};

function HelpActionCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.actionIcon}>
        <Feather name={icon} size={18} color={AppColors.tab.active} />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.actionDescription} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={AppColors.gray[400]} />
    </Pressable>
  );
}

function FaqRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={({ pressed }) => [styles.faqRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.faqRowTop}>
        <Text style={styles.faqTitle}>{title}</Text>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={AppColors.gray[500]}
        />
      </View>
      {open ? <Text style={styles.faqDescription}>{description}</Text> : null}
    </Pressable>
  );
}

export default function HelpCenter() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const forumHref: Href = useMemo(() => {
    if (user && isComercioUser(user.email ?? '', user.profile ?? '')) {
      return '/comerciante/forum';
    }
    return '/(tabs)/forum';
  }, [user]);

  const faq: HelpItem[] = useMemo(
    () => [
      {
        id: 'faq-1',
        title: 'Como alterar meus dados?',
        description: 'Vá em Conta e edite suas informações de perfil.',
      },
      {
        id: 'faq-2',
        title: 'Como reportar um problema na cidade?',
        description:
          'No início, use a seção de problemas reportados para registrar uma ocorrência.',
      },
      {
        id: 'faq-3',
        title: 'Não estou vendo o mapa, o que faço?',
        description:
          'Verifique a permissão de localização do navegador/dispositivo e tente recarregar. Se persistir, reporte como bug abaixo.',
      },
      {
        id: 'faq-4',
        title: 'Como funcionam as missões e os benefícios?',
        description:
          'No Programa Cidadão, as missões dão pontos quando a prefeitura aprova a comprovação. Esses pontos formam o saldo para resgatar benefícios: valor negativo desconta, valor positivo credita.',
      },
    ],
    [],
  );

  const filteredFaq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faq;
    return faq.filter(
      (i) =>
        i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
    );
  }, [faq, query]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>AJUDA</Text>
        <Text style={styles.title}>Como podemos te ajudar?</Text>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={18} color={AppColors.gray[500]} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por assunto"
          placeholderTextColor={AppColors.gray[400]}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length ? (
          <Pressable
            onPress={() => setQuery('')}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
            hitSlop={10}
          >
            <Feather name="x" size={18} color={AppColors.gray[500]} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acessos rápidos</Text>
        <View style={styles.actions}>
          {/* <HelpActionCard
            icon="alert-octagon"
            title="Reportar bug"
            description="Descreva um problema no app."
            onPress={() => router.push('/ajuda/reportar-bug' as Href)}
          /> */}
          <HelpActionCard
            icon="message-square"
            title="Feed"
            description="Tire dúvidas e participe de discussões."
            onPress={() => router.push(forumHref)}
          />
          <HelpActionCard
            icon="message-circle"
            title="Falar com suporte"
            description="Abra o canal de atendimento."
            onPress={() => router.push('/(tabs)/messages')}
          />
          {/* <HelpActionCard
            icon="shield"
            title="Privacidade e segurança"
            description="Saiba como seus dados são tratados."
            onPress={() => router.push('/ajuda/privacidade' as Href)}
          /> */}
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        <View style={styles.faqList}>
          {filteredFaq.map((item) => (
            <FaqRow key={item.id} title={item.title} description={item.description} />
          ))}
          {filteredFaq.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum resultado para “{query}”.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.background.default,
  },
  content: {
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 14,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: AppColors.text.tertiary,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  searchWrap: {
    marginHorizontal: 24,
    marginTop: 6,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.background.default,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: AppColors.text.secondary,
    paddingVertical: 0,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text.secondary,
    marginBottom: 12,
  },
  actions: {
    gap: 12,
  },
  sectionDescription: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
    marginTop: -6,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
    shadowColor: AppColors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 210, 200, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 200, 0.18)',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.text.secondary,
    marginBottom: 3,
  },
  actionDescription: {
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },
  faqList: {
    gap: 10,
  },
  faqRow: {
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: AppColors.border.muted,
  },
  faqRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.text.secondary,
  },
  faqDescription: {
    marginTop: 10,
    fontSize: 13,
    color: AppColors.text.tertiary,
    lineHeight: 18,
  },
  empty: {
    paddingVertical: 14,
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.text.tertiary,
  },
  pressed: {
    opacity: 0.92,
  },
  reportBug: {
    marginTop: 10,
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  reportBugInput: {
    flex: 1,
    fontSize: 15,
    color: AppColors.text.secondary,
    paddingVertical: 0,
  },
});

