import { currentHostId, publicServicesRequest } from './publicServicesHttp';

/** Curso gratuito ou profissionalizante da prefeitura (EJA, informática, idiomas…). */
export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  workloadHours: number | null;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  location: string | null;
  seats: number;
  enrolledCount: number;
  seatsLeft: number;
  enrolled?: boolean;
}

export function getCourses(): Promise<Course[]> {
  return publicServicesRequest<Course[]>('/education/courses', {
    query: { hostId: currentHostId() },
  });
}

export function enrollInCourse(id: string): Promise<Course> {
  return publicServicesRequest<Course>(`/education/courses/${encodeURIComponent(id)}/enroll`, {
    method: 'POST',
  });
}

export function leaveCourse(id: string): Promise<void> {
  return publicServicesRequest<void>(`/education/courses/${encodeURIComponent(id)}/enroll`, {
    method: 'DELETE',
  });
}
