import { Redirect, type Href } from 'expo-router';

/** Compatibilidade: entrada antiga redireciona para o stack de Educação. */
export default function EducationTab() {
  return <Redirect href={'/education' as Href} />;
}
