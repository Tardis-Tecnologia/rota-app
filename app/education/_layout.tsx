import { AppColors } from '@/constants/theme';
import { educationGoBack } from '@/utils/educationNavigation';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

function EducationBackButton() {
  return (
    <Pressable
      onPress={educationGoBack}
      hitSlop={12}
      style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
    >
      <Ionicons name="arrow-back" size={22} color={AppColors.text.secondary} />
    </Pressable>
  );
}

export default function EducationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: AppColors.background.default },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
          color: AppColors.text.secondary,
        },
        headerLeft: () => <EducationBackButton />,
        contentStyle: { backgroundColor: AppColors.background.light },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Educação' }} />
      <Stack.Screen name="prematricula/index" options={{ title: 'Pré-matrícula' }} />
      <Stack.Screen name="prematricula/[level]" options={{ title: 'Escolas' }} />
      <Stack.Screen name="prematricula/escola/[id]" options={{ title: 'Escola' }} />
      <Stack.Screen name="prematricula/formulario" options={{ title: 'Formulário' }} />
      <Stack.Screen name="solicitacoes/index" options={{ title: 'Solicitações' }} />
      <Stack.Screen name="solicitacoes/[id]" options={{ title: 'Protocolo' }} />
      <Stack.Screen name="minhas-matriculas/index" options={{ title: 'Minhas matrículas' }} />
      <Stack.Screen name="minhas-matriculas/[id]" options={{ title: 'Matrícula' }} />
      <Stack.Screen name="transferencia" options={{ title: 'Transferência' }} />
      <Stack.Screen name="boletim" options={{ title: 'Boletim escolar' }} />
      <Stack.Screen name="frequencia" options={{ title: 'Frequência' }} />
      <Stack.Screen name="calendario" options={{ title: 'Calendário escolar' }} />
      <Stack.Screen name="comunicados/index" options={{ title: 'Comunicados' }} />
      <Stack.Screen name="comunicados/[id]" options={{ title: 'Comunicado' }} />
      <Stack.Screen name="alimentacao" options={{ title: 'Alimentação escolar' }} />
      <Stack.Screen name="documentos" options={{ title: 'Documentos' }} />
      <Stack.Screen name="ouvidoria" options={{ title: 'Ouvidoria' }} />
      <Stack.Screen name="cursos/index" options={{ title: 'Cursos' }} />
      <Stack.Screen name="cursos/[id]/index" options={{ title: 'Curso' }} />
      <Stack.Screen name="cursos/[id]/inscrever" options={{ title: 'Inscrição' }} />
      <Stack.Screen name="cursos/inscricoes/[id]" options={{ title: 'Minha inscrição' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 999,
  },
  backBtnPressed: {
    backgroundColor: AppColors.background.input,
  },
});
