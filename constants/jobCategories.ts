/** Categorias para filtro da tela de Oportunidades (vagas) */
export const JOB_CATEGORIES = [
  { id: 'todos', label: 'TODOS' },
  { id: 'clt', label: 'CLT' },
  { id: 'jovem-aprendiz', label: 'JOVEM APRENDIZ' },
  { id: 'estagio', label: 'ESTÁGIO' },
] as const;

export type JobCategoryId = (typeof JOB_CATEGORIES)[number]['id'];
