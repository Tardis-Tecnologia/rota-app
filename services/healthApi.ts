import {
  currentHostId,
  publicServicesOptionalAuthRequest,
  publicServicesRequest,
} from './publicServicesHttp';

export type HealthUnitType = 'UBS' | 'UPA' | 'HOSPITAL' | 'CLINICA' | 'CAPS';
export type HealthServiceKind = 'CONSULTATION' | 'EXAM';
export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
export type ReferralPriority = 'ROUTINE' | 'PRIORITY' | 'URGENT';
export type ReferralStatus = 'WAITING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type TeleconsultStatus = 'REQUESTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface HealthUnit {
  id: string;
  name: string;
  type: HealthUnitType;
  address: string | null;
  neighborhood: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: string | null;
  specialties: string[];
  exams: string[];
}

export interface HealthUnitSummary {
  id: string;
  name: string;
  type: HealthUnitType;
  address: string | null;
  phone: string | null;
}

export interface HealthSlot {
  id: string;
  unitId: string;
  kind: HealthServiceKind;
  specialty: string;
  professionalName: string | null;
  startsAt: string;
  durationMinutes: number;
}

export interface Appointment {
  id: string;
  patientName: string;
  reason: string | null;
  status: AppointmentStatus;
  kind: HealthServiceKind;
  specialty: string;
  professionalName: string | null;
  startsAt: string;
  durationMinutes: number;
  unit: HealthUnitSummary;
  createdAt: string;
}

export interface ExamResult {
  id: string;
  patientName: string;
  examName: string;
  unit: HealthUnitSummary | null;
  resultDate: string;
  fileName: string;
  notes: string | null;
  viewedAt: string | null;
}

export interface Referral {
  id: string;
  patientName: string;
  specialty: string;
  originUnit: HealthUnitSummary | null;
  priority: ReferralPriority;
  status: ReferralStatus;
  queuePosition: number | null;
  queueTotal: number | null;
  scheduledAt: string | null;
  scheduledPlace: string | null;
  createdAt: string;
}

export interface Teleconsult {
  id: string;
  patientName: string;
  symptoms: string;
  status: TeleconsultStatus;
  scheduledAt: string | null;
  meetingUrl: string | null;
  professionalName: string | null;
  createdAt: string;
}

export const HEALTH_UNIT_TYPE_LABELS: Record<HealthUnitType, string> = {
  UBS: 'UBS',
  UPA: 'UPA 24h',
  HOSPITAL: 'Hospital',
  CLINICA: 'Clínica',
  CAPS: 'CAPS',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CANCELLED: 'Cancelado',
  ATTENDED: 'Realizado',
  NO_SHOW: 'Falta',
};

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  WAITING: 'Na fila',
  SCHEDULED: 'Consulta marcada',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const REFERRAL_PRIORITY_LABELS: Record<ReferralPriority, string> = {
  ROUTINE: 'Rotina',
  PRIORITY: 'Prioritário',
  URGENT: 'Urgente',
};

export const TELECONSULT_STATUS_LABELS: Record<TeleconsultStatus, string> = {
  REQUESTED: 'Aguardando a equipe',
  SCHEDULED: 'Agendada',
  COMPLETED: 'Realizada',
  CANCELLED: 'Cancelada',
};

// --- Unidades ---

export function getHealthUnits(filters?: {
  type?: HealthUnitType;
  specialty?: string;
  exam?: string;
}): Promise<HealthUnit[]> {
  return publicServicesOptionalAuthRequest<HealthUnit[]>('/health/units', {
    query: { hostId: currentHostId(), ...filters },
  });
}

export function getReferenceUnit(): Promise<HealthUnit | null> {
  return publicServicesRequest<HealthUnit | null>('/health/reference-unit', {
    query: { hostId: currentHostId() },
  }).then((u) => u ?? null);
}

export function setReferenceUnit(unitId: string): Promise<HealthUnit> {
  return publicServicesRequest<HealthUnit>('/health/reference-unit', {
    method: 'PUT',
    body: { unitId },
  });
}

export function clearReferenceUnit(): Promise<void> {
  return publicServicesRequest<void>('/health/reference-unit', {
    method: 'DELETE',
    query: { hostId: currentHostId() },
  });
}

export function getAvailableSlots(
  unitId: string,
  filters: { kind: HealthServiceKind; specialty?: string; days?: number },
): Promise<HealthSlot[]> {
  return publicServicesOptionalAuthRequest<HealthSlot[]>(`/health/units/${encodeURIComponent(unitId)}/slots`, {
    query: { kind: filters.kind, specialty: filters.specialty, days: filters.days ?? 21 },
  });
}

// --- Agendamentos ---

export function bookAppointment(input: {
  slotId: string;
  patientName: string;
  patientCpf?: string;
  reason?: string;
}): Promise<Appointment> {
  return publicServicesRequest<Appointment>('/health/appointments', {
    method: 'POST',
    body: input,
  });
}

export function rescheduleAppointment(id: string, slotId: string): Promise<Appointment> {
  return publicServicesRequest<Appointment>(
    `/health/appointments/${encodeURIComponent(id)}/reschedule`,
    { method: 'PATCH', body: { slotId } },
  );
}

export function getMyAppointments(): Promise<Appointment[]> {
  return publicServicesRequest<Appointment[]>('/health/appointments/me', {
    query: { hostId: currentHostId() },
  });
}

export function cancelAppointment(id: string): Promise<void> {
  return publicServicesRequest<void>(`/health/appointments/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
  });
}

// --- Exames ---

export function getMyExamResults(): Promise<ExamResult[]> {
  return publicServicesRequest<ExamResult[]>('/health/exam-results/me', {
    query: { hostId: currentHostId() },
  });
}

export function getExamResultLink(id: string): Promise<{ url: string; expiresAt: string }> {
  return publicServicesRequest<{ url: string; expiresAt: string }>(
    `/health/exam-results/${encodeURIComponent(id)}/link`,
    { method: 'POST' },
  );
}

// --- Fila de especialista ---

export function getMyReferrals(): Promise<Referral[]> {
  return publicServicesRequest<Referral[]>('/health/referrals/me', {
    query: { hostId: currentHostId() },
  });
}

// --- Teleconsulta ---

export function requestTeleconsult(input: {
  patientName: string;
  symptoms: string;
  triageAnswers?: Record<string, unknown>;
}): Promise<Teleconsult> {
  return publicServicesRequest<Teleconsult>('/health/teleconsults', {
    method: 'POST',
    body: { ...input, hostId: currentHostId() },
  });
}

export function getMyTeleconsults(): Promise<Teleconsult[]> {
  return publicServicesRequest<Teleconsult[]>('/health/teleconsults/me', {
    query: { hostId: currentHostId() },
  });
}

export function cancelTeleconsult(id: string): Promise<void> {
  return publicServicesRequest<void>(`/health/teleconsults/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
  });
}

// --- Formatação ---

/** "seg., 20/10 · 08:20" no fuso do aparelho. */
export function formatSlotDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Chave do dia local (AAAA-MM-DD) para agrupar horários. */
export function localDayKey(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function kindLabel(kind: HealthServiceKind): string {
  return kind === 'EXAM' ? 'Exame' : 'Consulta';
}
