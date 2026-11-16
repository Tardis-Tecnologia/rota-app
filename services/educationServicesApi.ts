import { currentHostId, publicServicesRequest } from './publicServicesHttp';

export interface SchoolVacancy {
  id: string;
  series: string;
  shift: string;
  availableSeats: number;
  waitlist: number;
}

export interface School {
  id: string;
  name: string;
  region: string;
  level: 'INFANTIL' | 'FUNDAMENTAL' | 'MEDIO';
  address: string;
  latitude: number;
  longitude: number;
  vacancies: SchoolVacancy[];
}

export interface EducationRequest {
  id: string;
  kind: string;
  status: string;
  studentName: string;
  series: string | null;
  message: string | null;
  note: string | null;
  createdAt: string;
  school: { id: string; name: string; region: string } | null;
  targetSchool: { id: string; name: string; region: string } | null;
}

export interface StudentRecord {
  id: string;
  name: string;
  series: string;
  school: { id: string; name: string; region: string };
  grades: { id: string; subject: string; period: string; grade: number }[];
  attendance: { id: string; month: string; presences: number; absences: number }[];
  declarations: { id: string; kind: string; status: string; body: string | null }[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  kind: string;
  date: string;
}

export interface SchoolMenu {
  id: string;
  date: string;
  meal: string;
  description: string;
}

export interface SchoolNotice {
  id: string;
  title: string;
  body: string;
  kind: string;
  date: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  neighborhood: string;
  departure: string;
  arrival: string;
  schoolName: string;
  region: string;
}

const hostQuery = () => ({ hostId: currentHostId() });

export const getSchools = () => publicServicesRequest<School[]>('/education/schools', { query: hostQuery() });

export const getMyRequests = () =>
  publicServicesRequest<EducationRequest[]>('/education/requests/me', { query: hostQuery() });

export const createEducationRequest = (body: {
  kind: string;
  studentName: string;
  series?: string;
  schoolId?: string;
  targetSchoolId?: string;
  message?: string;
}) =>
  publicServicesRequest<EducationRequest>('/education/requests', {
    method: 'POST',
    body: { ...body, hostId: currentHostId() },
  });

export const getMyStudent = () =>
  publicServicesRequest<StudentRecord | null>('/education/students/me', { query: hostQuery() });

export const getCalendar = () =>
  publicServicesRequest<CalendarEvent[]>('/education/calendar', { query: hostQuery() });

export const getMenus = () => publicServicesRequest<SchoolMenu[]>('/education/menus', { query: hostQuery() });

export const getNotices = () =>
  publicServicesRequest<SchoolNotice[]>('/education/notices', { query: hostQuery() });

export const getRoutes = () =>
  publicServicesRequest<TransportRoute[]>('/education/routes', { query: hostQuery() });

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Recebida',
  IN_REVIEW: 'Em análise',
  WAITLIST: 'Lista de espera',
  PENDING: 'Pendência',
  APPROVED: 'Deferida',
  REJECTED: 'Indeferida',
};

export const LEVEL_LABEL: Record<string, string> = {
  INFANTIL: 'Educação infantil',
  FUNDAMENTAL: 'Fundamental',
  MEDIO: 'Médio',
};

export const CALENDAR_LABEL: Record<string, string> = {
  HOLIDAY: 'Feriado',
  EXAM: 'Prova',
  MEETING: 'Reunião',
  VACATION: 'Férias',
};

export const NOTICE_LABEL: Record<string, string> = {
  MEETING: 'Reunião',
  SUSPENSION: 'Suspensão de aulas',
  EVENT: 'Evento',
};

export const DECLARATION_LABEL: Record<string, string> = {
  ENROLLMENT: 'Declaração de matrícula',
  SCHOOLING: 'Declaração de escolaridade',
};
