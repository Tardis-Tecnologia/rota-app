import { resolveCourseCoverFallback } from '@/utils/courseCoverImages';
import { getApiBaseUrl, getAuthToken } from './authApi';
import {
  currentHostId,
  publicServicesOptionalAuthRequest,
  publicServicesRequest,
} from './publicServicesHttp';

export type CourseModality = 'PRESENTIAL' | 'ONLINE' | 'HYBRID';

export type CourseEnrollmentStatus =
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'AWAITING_DOCS'
  | 'WAITLIST'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface CourseCategory {
  id: string;
  hostId: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
}

export interface CourseClass {
  id: string;
  courseId: string;
  name: string;
  shift: string | null;
  schedule: string | null;
  seats: number;
  enrolledCount: number;
  seatsLeft: number;
  waitlistEnabled: boolean;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}

export interface Course {
  id: string;
  hostId: string;
  title: string;
  description: string | null;
  summary: string | null;
  fullDescription: string | null;
  syllabus: string | null;
  objectives: string | null;
  targetAudience: string | null;
  prerequisites: string | null;
  minAge: number | null;
  categoryId: string | null;
  category: string | null;
  categoryName: string | null;
  modality: CourseModality;
  institution: string | null;
  neighborhood: string | null;
  address: string | null;
  shift: string | null;
  workloadHours: number | null;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  location: string | null;
  enrollmentOpensAt: string | null;
  enrollmentClosesAt: string | null;
  registrationOpen: boolean;
  enrollmentOpenNow: boolean;
  isFree: boolean;
  showVacancies: boolean;
  requiredDocuments: string[];
  certificateInfo: string | null;
  imageId: string | null;
  imageUrl: string | null;
  seats: number;
  enrolledCount: number;
  seatsLeft: number;
  published: boolean;
  active: boolean;
  enrolled?: boolean;
  myEnrollmentId?: string | null;
  myEnrollmentStatus?: CourseEnrollmentStatus | null;
  classes?: CourseClass[];
}

export interface CourseEnrollment {
  id: string;
  protocol: string;
  status: CourseEnrollmentStatus;
  courseId: string;
  courseTitle: string;
  institution: string | null;
  modality: CourseModality | null;
  classId: string | null;
  className: string | null;
  classShift: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  applicantName?: string | null;
  applicantCpf?: string | null;
  applicantRg?: string | null;
  notes: string | null;
  orientation: string | null;
  accessInfo?: string | null;
  cancelAllowed: boolean;
  createdAt: string;
  updatedAt: string;
  documents?: { id: string; name: string; kind: string | null; url: string; createdAt: string }[];
  events?: {
    id: string;
    status: CourseEnrollmentStatus;
    message: string | null;
    actorId: string | null;
    createdAt: string;
  }[];
  notices?: {
    id: string;
    title: string;
    body: string;
    kind: string;
    createdAt: string;
  }[];
  pendingDocuments?: string[];
  nextSteps?: string | null;
  /** Motivo/mensagem da prefeitura no status atual (ex.: aprovação ou reprovação). */
  statusReason?: string | null;
}

export interface CourseCertificate {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string | null;
  code: string | null;
  issuedAt: string;
}

export interface CourseMedal {
  id: string;
  code: string;
  title: string;
  description: string;
  iconKey: string | null;
  earnedAt: string;
}

export interface CourseAchievements {
  certificates: CourseCertificate[];
  medals: CourseMedal[];
}

export interface CourseListFilters {
  q?: string;
  categoryId?: string;
  modality?: CourseModality;
  neighborhood?: string;
  openOnly?: boolean;
  freeOnly?: boolean;
}

export const COURSE_STATUS_LABEL: Record<CourseEnrollmentStatus, string> = {
  RECEIVED: 'Em análise',
  IN_REVIEW: 'Em análise',
  AWAITING_DOCS: 'Aguardando documentação',
  WAITLIST: 'Lista de espera',
  CONFIRMED: 'Aprovado',
  REJECTED: 'Reprovado',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Curso concluído',
};

export const COURSE_STATUS_TONE: Record<
  CourseEnrollmentStatus,
  { bg: string; text: string }
> = {
  RECEIVED: { bg: '#FEF3C7', text: '#B45309' },
  IN_REVIEW: { bg: '#FEF3C7', text: '#B45309' },
  AWAITING_DOCS: { bg: '#FFEDD5', text: '#C2410C' },
  WAITLIST: { bg: '#EDE9FE', text: '#6D28D9' },
  CONFIRMED: { bg: '#D1FAE5', text: '#047857' },
  REJECTED: { bg: '#FEE2E2', text: '#B91C1C' },
  CANCELLED: { bg: '#F1F5F9', text: '#64748B' },
  COMPLETED: { bg: '#DBEAFE', text: '#1D4ED8' },
};

export const COURSE_MODALITY_LABEL: Record<CourseModality, string> = {
  PRESENTIAL: 'Presencial',
  ONLINE: 'Online',
  HYBRID: 'Híbrido',
};

/** Resolve capa do curso via proxy autenticado (mesmo padrão de missões/reports). */
export function resolveCourseImageSource(
  course: Pick<Course, 'imageId' | 'imageUrl' | 'title' | 'categoryName' | 'category'>,
): { uri: string; headers?: { Authorization: string } } {
  const imageId = course.imageId?.trim();
  let uri: string | null = null;
  if (imageId) {
    uri = `${getApiBaseUrl()}/api/v1/upload/files/${encodeURIComponent(imageId)}`;
  } else {
    const url = course.imageUrl?.trim() || null;
    if (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) uri = url;
      else if (url.startsWith('/')) uri = `${getApiBaseUrl()}${url}`;
      else uri = url;
    }
  }
  if (!uri) {
    uri = resolveCourseCoverFallback(course.title, course.categoryName || course.category);
  }
  const token = getAuthToken();
  const needsAuth = uri.includes('/api/v1/upload/files/') || uri.startsWith(getApiBaseUrl());
  return {
    uri,
    ...(token && needsAuth ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };
}

const courseCache = new Map<string, Course>();

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeCourse(raw: Course): Course {
  const modality =
    raw.modality && raw.modality in COURSE_MODALITY_LABEL ? raw.modality : 'PRESENTIAL';
  const registrationOpen = raw.registrationOpen !== false;
  const seats = Number(raw.seats ?? 0);
  const enrolledCount = Number(raw.enrolledCount ?? 0);
  return {
    ...raw,
    modality,
    registrationOpen,
    enrollmentOpenNow: raw.enrollmentOpenNow ?? (registrationOpen && raw.active !== false),
    isFree: raw.isFree !== false,
    showVacancies: raw.showVacancies !== false && raw.seatsLeft != null,
    requiredDocuments: asStringArray(raw.requiredDocuments),
    seats,
    enrolledCount,
    seatsLeft: raw.seatsLeft ?? Math.max(seats - enrolledCount, 0),
    published: raw.published !== false,
    active: raw.active !== false,
    classes: raw.classes ?? [],
  };
}

function rememberCourses(courses: Course[]): Course[] {
  for (const course of courses) courseCache.set(course.id, course);
  return courses;
}

function asCourseList(raw: unknown): Course[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
      ? ((raw as { items: Course[] }).items ?? [])
      : [];
  return rememberCourses(rows.map((row) => normalizeCourse(row)));
}

function courseToEnrollment(course: Course): CourseEnrollment {
  return {
    id: course.myEnrollmentId || `enrolled-${course.id}`,
    protocol: 'INSCRITO',
    status: course.myEnrollmentStatus || 'RECEIVED',
    courseId: course.id,
    courseTitle: course.title,
    institution: course.institution,
    modality: course.modality,
    classId: null,
    className: null,
    classShift: course.shift,
    userId: '',
    userName: null,
    userEmail: null,
    notes: null,
    orientation: null,
    cancelAllowed: false,
    createdAt: course.startDate || new Date().toISOString(),
    updatedAt: course.startDate || new Date().toISOString(),
  };
}

export function getCourseCategories(): Promise<CourseCategory[]> {
  return publicServicesOptionalAuthRequest<CourseCategory[]>('/education/courses/categories', {
    query: { hostId: currentHostId() },
  }).catch(() => []);
}

export async function getCourses(filters: CourseListFilters = {}): Promise<Course[]> {
  const query = {
    hostId: currentHostId(),
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.modality ? { modality: filters.modality } : {}),
    ...(filters.neighborhood ? { neighborhood: filters.neighborhood } : {}),
    ...(filters.openOnly ? { openOnly: true } : {}),
    ...(filters.freeOnly ? { freeOnly: true } : {}),
  };
  try {
    return asCourseList(
      await publicServicesOptionalAuthRequest<unknown>('/education/courses', { query }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const rejectedFilter = /should not exist|property .* should not/i.test(message);
    if (!rejectedFilter) throw error;
    return asCourseList(
      await publicServicesOptionalAuthRequest<unknown>('/education/courses', {
        query: {
          hostId: currentHostId(),
          ...(filters.q ? { q: filters.q } : {}),
        },
      }),
    );
  }
}

export async function getCourse(id: string): Promise<Course> {
  try {
    const course = normalizeCourse(
      await publicServicesOptionalAuthRequest<Course>(
        `/education/courses/${encodeURIComponent(id)}`,
      ),
    );
    courseCache.set(course.id, course);
    return course;
  } catch (error) {
    const cached = courseCache.get(id);
    if (cached) return cached;
    throw error;
  }
}

export async function getMyCourseEnrollments(): Promise<CourseEnrollment[]> {
  try {
    const rows = await publicServicesRequest<CourseEnrollment[]>('/education/course-enrollments/me', {
      query: { hostId: currentHostId() },
    });
    return Array.isArray(rows) ? rows : [];
  } catch {
    try {
      const mine = asCourseList(
        await publicServicesRequest<unknown>('/education/courses/me', {
          query: { hostId: currentHostId() },
        }),
      );
      return mine.map(courseToEnrollment);
    } catch {
      return [];
    }
  }
}

export function getCourseEnrollment(id: string): Promise<CourseEnrollment> {
  return publicServicesRequest<CourseEnrollment>(
    `/education/course-enrollments/${encodeURIComponent(id)}`,
  );
}

export function enrollInCourse(
  id: string,
  body: {
    classId: string;
    applicantName: string;
    applicantCpf: string;
    applicantRg: string;
    notes?: string;
    documents?: { name: string; kind?: string; url: string }[];
  },
): Promise<CourseEnrollment> {
  return publicServicesRequest<CourseEnrollment>(
    `/education/courses/${encodeURIComponent(id)}/enroll`,
    { method: 'POST', body },
  );
}

export function getMyCourseAchievements(): Promise<CourseAchievements> {
  return publicServicesRequest<CourseAchievements>('/education/achievements/me', {
    query: { hostId: currentHostId() },
  });
}

export async function uploadCourseDocumentFromUri(
  uri: string,
  options?: { mimeType?: string; fileName?: string },
): Promise<{ id: string; publicUrl: string }> {
  const base = getApiBaseUrl();
  const mime = options?.mimeType?.trim() || 'image/jpeg';
  const name = options?.fileName?.trim() || 'course-document.jpg';
  const form = new FormData();
  form.append('file', {
    uri,
    name,
    type: mime,
  } as unknown as Blob);

  const url = `${base}/api/v1/upload/supabase/image`;
  const token = getAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { method: 'POST', headers, body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text.slice(0, 180) || `Falha no upload (${res.status})`);
  }
  return (await res.json()) as { id: string; publicUrl: string };
}

export function cancelCourseEnrollment(id: string): Promise<CourseEnrollment> {
  return publicServicesRequest<CourseEnrollment>(
    `/education/course-enrollments/${encodeURIComponent(id)}/cancel`,
    { method: 'POST' },
  );
}

export function addCourseEnrollmentDocument(
  id: string,
  body: { name: string; kind?: string; url: string },
): Promise<CourseEnrollment> {
  return publicServicesRequest<CourseEnrollment>(
    `/education/course-enrollments/${encodeURIComponent(id)}/documents`,
    { method: 'POST', body },
  );
}

/** @deprecated Use enrollInCourse with classId */
export function leaveCourse(id: string): Promise<void> {
  return publicServicesRequest<void>(`/education/courses/${encodeURIComponent(id)}/enroll`, {
    method: 'DELETE',
  });
}
