export type MaricaEdital = {
  id: string;
  title: string;
  organ: string;
  status: string;
  summary: string;
  about: string;
  spots: string;
  period: string;
  who: string;
  registrationUrl: string;
  registrationLabel: string;
  actionLabel: string;
};

/** Editais oficiais de Maricá, com o cadastro no site da prefeitura ou do programa. */
export const MARICA_EDITAIS: MaricaEdital[] = [
  {
    id: 'passaporte-016-2026',
    title: 'Passaporte Universitário — Edital nº 016/2026',
    organ: 'Secretaria de Educação',
    status: 'Portal oficial',
    summary:
      'Bolsas integrais de graduação para moradores de Maricá, em cursos como Arquitetura, Farmácia, Biomedicina e Pedagogia.',
    about:
      'O programa oferece até 255 bolsas integrais em instituições conveniadas. O cadastro é feito no portal do Passaporte Universitário, com o envio da documentação pedida no edital. A listagem e os recursos também saem por lá.',
    spots: 'Até 255 bolsas',
    period: 'Inscrições divulgadas de 26 a 30/03/2026. O andamento fica no portal do programa.',
    who: 'Moradores de Maricá com ensino médio concluído, residência na cidade há pelo menos cinco anos e renda dentro dos limites do edital.',
    registrationUrl: 'https://passaporteuniversitario.marica.rj.gov.br',
    registrationLabel: 'passaporteuniversitario.marica.rj.gov.br',
    actionLabel: 'Ir para o cadastro',
  },
  {
    id: 'estagio-remunerado',
    title: 'Programa de Estágio Remunerado',
    organ: 'Secretaria de Trabalho',
    status: 'Cadastro no portal',
    summary:
      'Estágio de 4 horas por dia para estudantes do ensino médio, técnico ou superior, no serviço público do município.',
    about:
      'A inscrição é feita no Portal do Estágio, na opção Inscreva-se. É preciso anexar os documentos digitalizados e preencher o e-mail de contato, porque o andamento chega por lá. Bolsa e auxílio-transporte seguem o edital do programa.',
    spots: 'Vagas do processo seletivo vigente',
    period: 'O cronograma e o edital completo estão no portal do programa.',
    who: 'Estudante matriculado que já cursou pelo menos 40% do curso.',
    registrationUrl: 'https://estagio.marica.rj.gov.br/',
    registrationLabel: 'estagio.marica.rj.gov.br',
    actionLabel: 'Ir para o cadastro',
  },
  {
    id: 'desenrola-cultura',
    title: 'Desenrola Cultura',
    organ: 'Secretaria de Cultura',
    status: 'Inscrição na plataforma',
    summary:
      'Editais culturais de Maricá para artistas, produtores e coletivos, com inscrição e acompanhamento no mesmo lugar.',
    about:
      'A plataforma reúne os editais da Secretaria de Cultura. A pessoa cria uma conta, escolhe o edital e envia o projeto com os documentos daquela chamada. O resultado também é publicado na plataforma e no Jornal Oficial de Maricá.',
    spots: 'Conforme cada edital cultural',
    period: 'Cada edital tem o próprio prazo, informado na plataforma.',
    who: 'Agentes culturais, artistas, produtores e coletivos da cidade.',
    registrationUrl: 'https://desenrolacultura.marica.rj.gov.br/',
    registrationLabel: 'desenrolacultura.marica.rj.gov.br',
    actionLabel: 'Ir para o cadastro',
  },
  {
    id: 'residencia-medica-2026',
    title: 'Residência em Medicina de Família e Comunidade',
    organ: 'Secretaria de Saúde',
    status: 'Edital 2026',
    summary:
      'Dez vagas para residência de dois anos, com carga de 60 horas semanais e bolsa do Ministério da Saúde.',
    about:
      'Processo seletivo da COREME de Maricá para o primeiro ano da residência. A seleção foi por prova objetiva. O edital indica a inscrição pelo site da Secretaria de Saúde e o atendimento pelo e-mail da comissão.',
    spots: '10 vagas',
    period: 'Inscrições de 31/01 a 05/02/2026. Prova em 08/02/2026.',
    who: 'Médicos em situação regular no Cremerj, conforme as regras do edital.',
    registrationUrl:
      'https://www.marica.rj.gov.br/noticia/prefeitura-de-marica-inicia-selecao-para-residencia-medica-em-medicina-de-familia-e-comunidade/',
    registrationLabel: 'marica.rj.gov.br',
    actionLabel: 'Ver no site oficial',
  },
];

export function findMaricaEdital(id: string): MaricaEdital | undefined {
  return MARICA_EDITAIS.find((item) => item.id === id);
}
