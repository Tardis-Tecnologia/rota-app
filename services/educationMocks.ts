/**
 * Dados simulados da Educação.
 * Cada lista só entra na tela quando a API não devolve registros.
 * O campo `simulated` marca a origem para não misturar com dado real.
 */
import type {
  CalendarEvent,
  EducationRequest,
  School,
  SchoolMenu,
  SchoolNotice,
  StudentRecord,
  TransportRoute,
} from './educationServicesApi';

export const SIMULATED_SOURCE = 'simulado' as const;

export type EnrollmentDocument = {
  id: string;
  name: string;
  status: 'PENDING' | 'SENT' | 'APPROVED' | 'REJECTED';
  required: boolean;
};

export type EnrollmentDetail = {
  id: string;
  studentName: string;
  birthDate: string;
  school: string;
  schoolId: string;
  series: string;
  shift: string;
  status: string;
  statusCode: string;
  requestedAt: string;
  photo: string;
  simulated: boolean;
  documents: EnrollmentDocument[];
  history: { id: string; title: string; date: string; description: string }[];
};

export type RequestTimelineEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  done: boolean;
  current?: boolean;
};

export type EnrichedEducationRequest = EducationRequest & {
  protocol: string;
  nextSteps: string[];
  pendencies: string[];
  timeline: RequestTimelineEvent[];
};

export type AttendanceBySubject = {
  subject: string;
  classes: number;
  absences: number;
  percent: number;
};

export type TransportDetail = TransportRoute & {
  studentName: string;
  status: string;
  boardingPoints: { name: string; time: string }[];
  contactPhone: string;
  demoMapNote: string;
  latitude: number;
  longitude: number;
};

export const mockSchools: School[] = [
  {
    id: 'sim-escola-centro',
    name: 'EM Professor Benedito Odilon',
    region: 'Centro',
    level: 'FUNDAMENTAL',
    address: 'Rua Álvares de Castro, Centro, Maricá',
    latitude: -22.9184,
    longitude: -42.8189,
    vacancies: [
      { id: 'sim-v1', series: '1º ano', shift: 'Manhã', availableSeats: 6, waitlist: 2 },
      { id: 'sim-v2', series: '5º ano', shift: 'Tarde', availableSeats: 0, waitlist: 8 },
    ],
  },
  {
    id: 'sim-escola-itaipuacu',
    name: 'EM Itaipuaçu',
    region: 'Itaipuaçu',
    level: 'FUNDAMENTAL',
    address: 'Estrada de Itaipuaçu, Maricá',
    latitude: -22.9632,
    longitude: -42.9874,
    vacancies: [
      { id: 'sim-v3', series: '3º ano', shift: 'Manhã', availableSeats: 11, waitlist: 0 },
      { id: 'sim-v4', series: '9º ano', shift: 'Tarde', availableSeats: 4, waitlist: 1 },
    ],
  },
  {
    id: 'sim-escola-inoa',
    name: 'CIE Inoã',
    region: 'Inoã',
    level: 'MEDIO',
    address: 'Avenida Central, Inoã, Maricá',
    latitude: -22.9048,
    longitude: -42.9356,
    vacancies: [{ id: 'sim-v5', series: '1ª série', shift: 'Manhã', availableSeats: 9, waitlist: 3 }],
  },
  {
    id: 'sim-creche-sj',
    name: 'Creche Municipal São José',
    region: 'São José do Imbassaí',
    level: 'INFANTIL',
    address: 'Rua das Acácias, São José do Imbassaí',
    latitude: -22.9365,
    longitude: -42.8512,
    vacancies: [
      { id: 'sim-v6', series: 'Maternal', shift: 'Integral', availableSeats: 0, waitlist: 14 },
      { id: 'sim-v7', series: 'Berçário', shift: 'Integral', availableSeats: 1, waitlist: 6 },
    ],
  },
];

export const mockRequests: EducationRequest[] = [
  {
    id: 'sim-req-1',
    kind: 'ENROLLMENT',
    status: 'IN_REVIEW',
    studentName: 'Ana Costa',
    series: '6º ano',
    message: 'Matrícula digital para 2027.',
    note: 'Documentos em conferência.',
    createdAt: '2026-10-08T12:00:00.000Z',
    school: { id: 'sim-escola-centro', name: 'EM Professor Benedito Odilon', region: 'Centro' },
    targetSchool: null,
  },
  {
    id: 'sim-req-2',
    kind: 'TRANSFER',
    status: 'PENDING',
    studentName: 'Ana Costa',
    series: '5º ano',
    message: 'Transferência para Itaipuaçu. Falta o histórico.',
    note: 'Pendência: histórico escolar.',
    createdAt: '2026-09-20T12:00:00.000Z',
    school: { id: 'sim-escola-centro', name: 'EM Professor Benedito Odilon', region: 'Centro' },
    targetSchool: { id: 'sim-escola-itaipuacu', name: 'EM Itaipuaçu', region: 'Itaipuaçu' },
  },
  {
    id: 'sim-req-3',
    kind: 'DAYCARE',
    status: 'WAITLIST',
    studentName: 'Lucas Costa',
    series: 'Maternal',
    message: 'Fila da creche. Posição ilustrativa: 14.',
    note: null,
    createdAt: '2026-08-02T12:00:00.000Z',
    school: { id: 'sim-creche-sj', name: 'Creche Municipal São José', region: 'São José do Imbassaí' },
    targetSchool: null,
  },
  {
    id: 'sim-req-4',
    kind: 'DECLARATION',
    status: 'APPROVED',
    studentName: 'Ana Costa',
    series: '5º ano',
    message: 'Declaração de escolaridade.',
    note: 'Pronta para consulta.',
    createdAt: '2026-07-15T12:00:00.000Z',
    school: { id: 'sim-escola-centro', name: 'EM Professor Benedito Odilon', region: 'Centro' },
    targetSchool: null,
  },
  {
    id: 'sim-req-5',
    kind: 'OMBUDSMAN',
    status: 'REJECTED',
    studentName: 'Marina Costa',
    series: null,
    message: 'Reclamação sobre o horário da saída.',
    note: 'Indeferida: o horário informado está no calendário oficial.',
    createdAt: '2026-06-11T12:00:00.000Z',
    school: null,
    targetSchool: null,
  },
];

export const mockEnrichedRequests: EnrichedEducationRequest[] = mockRequests.map((req, index) => {
  const protocol = `EDU-2026-${String(1000 + index + 1)}`;
  const baseTimeline: RequestTimelineEvent[] = [
    {
      id: `${req.id}-t1`,
      title: 'Solicitação recebida',
      description: 'Pedido registrado no sistema educacional.',
      date: new Date(req.createdAt).toLocaleDateString('pt-BR'),
      done: true,
    },
    {
      id: `${req.id}-t2`,
      title: 'Em análise',
      description: 'Equipe pedagógica conferindo informações.',
      date: '',
      done: ['IN_REVIEW', 'PENDING', 'WAITLIST', 'APPROVED', 'REJECTED'].includes(req.status),
      current: req.status === 'IN_REVIEW',
    },
    {
      id: `${req.id}-t3`,
      title: req.status === 'WAITLIST' ? 'Lista de espera' : 'Conferência de documentos',
      description: req.note || 'Aguardando conclusão da análise.',
      date: '',
      done: ['PENDING', 'WAITLIST', 'APPROVED', 'REJECTED'].includes(req.status),
      current: req.status === 'PENDING' || req.status === 'WAITLIST',
    },
    {
      id: `${req.id}-t4`,
      title: 'Resultado',
      description:
        req.status === 'APPROVED'
          ? 'Solicitação deferida.'
          : req.status === 'REJECTED'
            ? 'Solicitação indeferida.'
            : 'Aguardando decisão final.',
      date: '',
      done: req.status === 'APPROVED' || req.status === 'REJECTED',
      current: req.status === 'APPROVED' || req.status === 'REJECTED',
    },
  ];

  const pendencies =
    req.status === 'PENDING'
      ? [req.note || 'Documentação incompleta']
      : req.status === 'WAITLIST'
        ? ['Acompanhar posição na fila']
        : [];

  const nextSteps =
    req.status === 'APPROVED'
      ? ['Baixar declaração ou comparecer à escola']
      : req.status === 'PENDING'
        ? ['Enviar documentos pendentes', 'Acompanhar protocolo']
        : req.status === 'WAITLIST'
          ? ['Manter dados atualizados', 'Aguardar chamada']
          : ['Acompanhar andamento pelo protocolo'];

  return { ...req, protocol, timeline: baseTimeline, pendencies, nextSteps };
});

export const mockStudent: StudentRecord = {
  id: 'sim-aluno',
  name: 'Ana Costa',
  series: '5º ano',
  school: { id: 'sim-escola-centro', name: 'EM Professor Benedito Odilon', region: 'Centro' },
  grades: [
    { id: 'sim-g1', subject: 'Português', period: '1º bimestre', grade: 7.5 },
    { id: 'sim-g2', subject: 'Português', period: '2º bimestre', grade: 8 },
    { id: 'sim-g3', subject: 'Português', period: '3º bimestre', grade: 8.5 },
    { id: 'sim-g4', subject: 'Matemática', period: '1º bimestre', grade: 6.5 },
    { id: 'sim-g5', subject: 'Matemática', period: '2º bimestre', grade: 6.8 },
    { id: 'sim-g6', subject: 'Matemática', period: '3º bimestre', grade: 7.2 },
    { id: 'sim-g7', subject: 'Ciências', period: '1º bimestre', grade: 8 },
    { id: 'sim-g8', subject: 'Ciências', period: '2º bimestre', grade: 8.5 },
    { id: 'sim-g9', subject: 'Ciências', period: '3º bimestre', grade: 9 },
    { id: 'sim-g10', subject: 'História', period: '1º bimestre', grade: 7 },
    { id: 'sim-g11', subject: 'História', period: '2º bimestre', grade: 7.5 },
    { id: 'sim-g12', subject: 'História', period: '3º bimestre', grade: 8 },
    { id: 'sim-g13', subject: 'Geografia', period: '1º bimestre', grade: 8 },
    { id: 'sim-g14', subject: 'Geografia', period: '2º bimestre', grade: 8.2 },
    { id: 'sim-g15', subject: 'Geografia', period: '3º bimestre', grade: 8.4 },
  ],
  attendance: [
    { id: 'sim-a1', month: '2026-08', presences: 17, absences: 3 },
    { id: 'sim-a2', month: '2026-09', presences: 18, absences: 2 },
    { id: 'sim-a3', month: '2026-10', presences: 20, absences: 1 },
  ],
  declarations: [
    {
      id: 'sim-d1',
      kind: 'ENROLLMENT',
      status: 'READY',
      body: 'Declaramos que Ana Costa está matriculada no 5º ano da EM Professor Benedito Odilon, turno da tarde, ano letivo de 2026.',
    },
    {
      id: 'sim-d2',
      kind: 'SCHOOLING',
      status: 'REQUESTED',
      body: null,
    },
  ],
};

export const mockStudents: StudentRecord[] = [
  mockStudent,
  {
    id: 'sim-aluno-2',
    name: 'Lucas Costa',
    series: 'Maternal',
    school: { id: 'sim-creche-sj', name: 'Creche Municipal São José', region: 'São José do Imbassaí' },
    grades: [],
    attendance: [
      { id: 'sim-a4', month: '2026-09', presences: 18, absences: 2 },
      { id: 'sim-a5', month: '2026-10', presences: 19, absences: 1 },
    ],
    declarations: [],
  },
];

export const mockEnrollments: EnrollmentDetail[] = [
  {
    id: 'sim-mat1',
    studentName: 'Ana Costa',
    birthDate: '12/03/2016',
    school: 'EM Professor Benedito Odilon',
    schoolId: 'sim-escola-centro',
    series: '5º ano',
    shift: 'Tarde',
    status: 'Matriculada',
    statusCode: 'APPROVED',
    requestedAt: '08/10/2026',
    photo:
      'https://images.unsplash.com/photo-1562774053-701939374585?w=400&auto=format&fit=crop&q=60',
    simulated: true,
    documents: [
      { id: 'doc1', name: 'Certidão de nascimento', status: 'APPROVED', required: true },
      { id: 'doc2', name: 'Comprovante de residência', status: 'APPROVED', required: true },
      { id: 'doc3', name: 'Cartão de vacinação', status: 'SENT', required: true },
      { id: 'doc4', name: 'Foto 3x4', status: 'PENDING', required: false },
    ],
    history: [
      {
        id: 'h1',
        title: 'Pré-matrícula enviada',
        date: '08/10/2026',
        description: 'Pedido registrado pelo responsável.',
      },
      {
        id: 'h2',
        title: 'Documentos conferidos',
        date: '12/10/2026',
        description: 'Secretaria validou a documentação principal.',
      },
      {
        id: 'h3',
        title: 'Matrícula confirmada',
        date: '15/10/2026',
        description: 'Aluna vinculada à turma do 5º ano — tarde.',
      },
    ],
  },
  {
    id: 'sim-mat2',
    studentName: 'Lucas Costa',
    birthDate: '22/07/2023',
    school: 'Creche Municipal São José',
    schoolId: 'sim-creche-sj',
    series: 'Maternal',
    shift: 'Integral',
    status: 'Em análise',
    statusCode: 'IN_REVIEW',
    requestedAt: '02/08/2026',
    photo:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=60',
    simulated: true,
    documents: [
      { id: 'doc5', name: 'Certidão de nascimento', status: 'APPROVED', required: true },
      { id: 'doc6', name: 'Comprovante de residência', status: 'PENDING', required: true },
      { id: 'doc7', name: 'Cartão de vacinação', status: 'SENT', required: true },
    ],
    history: [
      {
        id: 'h4',
        title: 'Solicitação de vaga',
        date: '02/08/2026',
        description: 'Pedido de creche enviado.',
      },
      {
        id: 'h5',
        title: 'Em análise',
        date: '05/08/2026',
        description: 'Aguardando comprovante de residência atualizado.',
      },
    ],
  },
];

export const mockAttendanceBySubject: AttendanceBySubject[] = [
  { subject: 'Português', classes: 40, absences: 2, percent: 95 },
  { subject: 'Matemática', classes: 40, absences: 4, percent: 90 },
  { subject: 'Ciências', classes: 36, absences: 1, percent: 97 },
  { subject: 'História', classes: 32, absences: 3, percent: 91 },
  { subject: 'Geografia', classes: 32, absences: 0, percent: 100 },
];

export const mockCalendar: CalendarEvent[] = [
  { id: 'sim-c1', title: 'Prova de Matemática — 5º ano', kind: 'EXAM', date: '2026-11-18' },
  { id: 'sim-c2', title: 'Reunião de pais', kind: 'MEETING', date: '2026-11-25' },
  { id: 'sim-c3', title: 'Feriado municipal', kind: 'HOLIDAY', date: '2026-12-08' },
  { id: 'sim-c4', title: 'Recesso de fim de ano', kind: 'VACATION', date: '2026-12-19' },
  { id: 'sim-c5', title: 'Prova de Português', kind: 'EXAM', date: '2026-11-12' },
  { id: 'sim-c6', title: 'Conselho de classe', kind: 'MEETING', date: '2026-11-28' },
];

export const mockMenus: SchoolMenu[] = [
  { id: 'sim-m1', date: '2026-11-10', meal: 'Café da manhã', description: 'Leite, pão com margarina e fruta.' },
  { id: 'sim-m2', date: '2026-11-10', meal: 'Almoço', description: 'Arroz, feijão, frango grelhado, salada e fruta.' },
  { id: 'sim-m3', date: '2026-11-11', meal: 'Café da manhã', description: 'Achocolatado, biscoito e banana.' },
  { id: 'sim-m4', date: '2026-11-11', meal: 'Almoço', description: 'Arroz, lentilha, carne moída, legumes e suco.' },
  { id: 'sim-m5', date: '2026-11-12', meal: 'Café da manhã', description: 'Mingau de aveia e maçã.' },
  { id: 'sim-m6', date: '2026-11-12', meal: 'Almoço', description: 'Macarrão, molho de tomate, omelete e banana.' },
  { id: 'sim-m7', date: '2026-11-13', meal: 'Almoço', description: 'Arroz, feijão, peixe, salada e suco.' },
  { id: 'sim-m8', date: '2026-11-14', meal: 'Almoço', description: 'Feijoada light, couve, farofa e laranja.' },
];

export type NoticeWithRead = SchoolNotice & {
  schoolName: string;
  read: boolean;
};

export const mockNotices: NoticeWithRead[] = [
  {
    id: 'sim-n1',
    title: 'Suspensão das aulas na sexta',
    kind: 'SUSPENSION',
    date: '2026-11-13',
    body: 'Aulas suspensas na sexta por capacitação dos professores. Retorno normal na segunda-feira.',
    schoolName: 'EM Professor Benedito Odilon',
    read: false,
  },
  {
    id: 'sim-n2',
    title: 'Reunião de pais do 5º ano',
    kind: 'MEETING',
    date: '2026-11-25',
    body: 'Encontro às 18h30 na EM Professor Benedito Odilon. Pauta: desempenho do 3º bimestre.',
    schoolName: 'EM Professor Benedito Odilon',
    read: true,
  },
  {
    id: 'sim-n3',
    title: 'Feira de ciências em Inoã',
    kind: 'EVENT',
    date: '2026-11-28',
    body: 'CIE Inoã, sábado, das 9h às 13h. Entrada gratuita para famílias da rede.',
    schoolName: 'CIE Inoã',
    read: false,
  },
];

export const mockRoutes: TransportRoute[] = [
  {
    id: 'sim-r1',
    name: 'Linha Centro — manhã',
    neighborhood: 'Centro',
    departure: '06:40',
    arrival: '07:10',
    schoolName: 'EM Professor Benedito Odilon',
    region: 'Centro',
  },
  {
    id: 'sim-r2',
    name: 'Linha Itaipuaçu — manhã',
    neighborhood: 'Itaipuaçu',
    departure: '06:20',
    arrival: '07:05',
    schoolName: 'EM Itaipuaçu',
    region: 'Itaipuaçu',
  },
];

export const mockTransportDetails: TransportDetail[] = [
  {
    ...mockRoutes[0],
    studentName: 'Ana Costa',
    status: 'Ativo',
    boardingPoints: [
      { name: 'Praça Jabour', time: '06:40' },
      { name: 'Rua do Comércio', time: '06:52' },
      { name: 'EM Benedito Odilon', time: '07:10' },
    ],
    contactPhone: '(22) 2637-0000',
    demoMapNote: 'Rota de demonstração — sem rastreamento em tempo real.',
    latitude: -22.9184,
    longitude: -42.8189,
  },
];

export const mockDocumentCatalog = [
  { id: 'decl-mat', kind: 'ENROLLMENT', title: 'Declaração de matrícula', description: 'Comprova vínculo ativo na rede.' },
  { id: 'decl-esc', kind: 'SCHOOLING', title: 'Declaração de escolaridade', description: 'Histórico resumido do aluno.' },
  { id: 'decl-freq', kind: 'ATTENDANCE', title: 'Declaração de frequência', description: 'Percentual de presença no período.' },
];

export function preferList<T>(remote: T[] | null | undefined, fallback: T[]): { items: T[]; simulated: boolean } {
  if (remote && remote.length > 0) return { items: remote, simulated: false };
  return { items: fallback, simulated: true };
}

export function getEnrollmentById(id: string): EnrollmentDetail | undefined {
  return mockEnrollments.find((e) => e.id === id);
}

export function getEnrichedRequestById(id: string): EnrichedEducationRequest | undefined {
  return mockEnrichedRequests.find((r) => r.id === id);
}

export function getSchoolById(id: string): School | undefined {
  return mockSchools.find((s) => s.id === id);
}

export function getStudentById(id: string): StudentRecord | undefined {
  return mockStudents.find((s) => s.id === id);
}

export function getNoticeById(id: string): NoticeWithRead | undefined {
  return mockNotices.find((n) => n.id === id);
}

/** Fallback compatível com SchoolNotice da API (sem campos de UI). */
export const mockNoticesFallback: SchoolNotice[] = mockNotices.map(
  ({ id, title, body, kind, date }) => ({ id, title, body, kind, date }),
);
