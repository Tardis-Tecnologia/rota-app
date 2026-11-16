import { router, type Href } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

/** Compat: redireciona para a área completa de cursos. */
export default function CoursesSection() {
  useEffect(() => {
    router.replace('/education/cursos' as Href);
  }, []);
  return <View />;
}
