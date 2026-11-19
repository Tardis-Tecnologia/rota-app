import { ensureAuthTokenHydrated, getApiBaseUrl, getAuthToken, getWhitelabelHostId } from './authApi';

const BASE = '/api/v1/jobs';

export type JobListing = {
  id: string;
  title: string;
  companyName: string;
  companyPhotoUrl: string | null;
  commercialAccountId: string | null;
  location: string;
  workType: string;
  contractType: string;
  salaryLabel: string;
  imageUrl: string | null;
  category: string;
  status: string;
  deadlineLabel: string | null;
  createdAt: string;
  description?: string;
  requirements?: string[];
  company?: {
    commercialAccountId: string | null;
    name: string;
    photoUrl: string | null;
    segment: string | null;
    address: string | null;
  };
  alreadyApplied?: boolean;
};

export type JobCandidateResumeFile = {
  id: string;
  publicUrl: string | null;
  fileName: string | null;
  contentType: string | null;
};

export type JobCandidateProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cpf: string | null;
  birthDate: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  educationLevel: string;
  courseOrArea: string | null;
  experienceSummary: string;
  skills: string[];
  about: string | null;
  linkedinUrl: string | null;
  resumeFile?: JobCandidateResumeFile | null;
  isComplete: boolean;
  missingFields: string[];
};

export type JobCandidateProfileInput = {
  fullName: string;
  email: string;
  phone: string;
  cpf?: string;
  birthDate?: string;
  city: string;
  neighborhood?: string;
  address?: string;
  educationLevel: string;
  courseOrArea?: string;
  experienceSummary: string;
  skills: string[];
  about?: string;
  linkedinUrl?: string;
};

async function readError(res: Response): Promise<string> {
  try {
    const raw = await res.text();
    if (!raw) return res.statusText || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(raw) as { message?: string | string[] };
      if (Array.isArray(j.message)) return j.message.join(' ');
      if (typeof j.message === 'string' && j.message.trim()) return j.message.trim();
    } catch {
      return raw.slice(0, 220);
    }
  } catch {
    // ignore
  }
  return res.statusText || `HTTP ${res.status}`;
}

async function authHeaders(json = true, required = false): Promise<Record<string, string>> {
  const token = (await ensureAuthTokenHydrated()) || getAuthToken();
  if (required && !token) {
    throw new Error('Faça login para continuar.');
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function mapJobsAuthError(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) {
    return Promise.resolve('Sessão expirada ou inválida. Faça login novamente.');
  }
  return readError(res).then((msg) => msg || fallback);
}

function hostQs(extra?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  params.set('hostId', getWhitelabelHostId());
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v?.trim()) params.set(k, v.trim());
    }
  }
  return params.toString();
}

export async function jobRecommendationReasons(query: string): Promise<Record<string, string>> {
  const q = query.trim();
  if (!q) return {};
  const base = getApiBaseUrl();
  const params = new URLSearchParams({ hostId: getWhitelabelHostId(), q });
  const res = await fetch(`${base}${BASE.replace('/jobs', '/recommendations')}?${params.toString()}`, {
    headers: await authHeaders(false),
  });
  if (!res.ok) return {};
  const data = (await res.json()) as {
    enabled?: boolean;
    items?: { kind?: string; id?: string; reason?: string | null }[];
  };
  if (!data.enabled || !Array.isArray(data.items)) return {};
  const reasons: Record<string, string> = {};
  for (const item of data.items) {
    if (item.kind === 'job' && item.id && item.reason) reasons[item.id] = item.reason;
  }
  return reasons;
}

export async function listJobs(options?: {
  category?: string;
  q?: string;
  commercialAccountId?: string;
  init?: number;
  end?: number;
}): Promise<JobListing[]> {
  const base = getApiBaseUrl();
  const qs = hostQs({
    category: options?.category,
    q: options?.q,
    commercialAccountId: options?.commercialAccountId,
    init: options?.init != null ? String(options.init) : '0',
    end: options?.end != null ? String(options.end) : '40',
  });
  const res = await fetch(`${base}${BASE}?${qs}`, { headers: await authHeaders(false) });
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return Array.isArray(data) ? (data as JobListing[]) : [];
}

export async function getJobById(id: string): Promise<JobListing | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const base = getApiBaseUrl();
  const res = await fetch(`${base}${BASE}/${encodeURIComponent(trimmed)}?${hostQs()}`, {
    headers: await authHeaders(false),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as JobListing;
}

export async function getMyJobCandidateProfile(): Promise<JobCandidateProfile | null> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}${BASE}/me/candidate-profile`, {
    headers: await authHeaders(false, true),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await mapJobsAuthError(res, 'Erro ao carregar perfil'));
  const raw = await res.text();
  if (!raw || raw === 'null') return null;
  try {
    const data = JSON.parse(raw) as JobCandidateProfile | null;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export async function upsertMyJobCandidateProfile(
  input: JobCandidateProfileInput,
): Promise<JobCandidateProfile> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}${BASE}/me/candidate-profile`, {
    method: 'PUT',
    headers: await authHeaders(true, true),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await mapJobsAuthError(res, 'Erro ao salvar perfil'));
  return (await res.json()) as JobCandidateProfile;
}

export async function applyToJob(
  jobId: string,
  coverMessage?: string,
): Promise<{ id: string; status: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(
    `${base}${BASE}/${encodeURIComponent(jobId.trim())}/applications?${hostQs()}`,
    {
      method: 'POST',
      headers: await authHeaders(true, true),
      body: JSON.stringify({ coverMessage: coverMessage?.trim() || undefined }),
    },
  );
  if (!res.ok) throw new Error(await mapJobsAuthError(res, 'Erro ao candidatar'));
  return (await res.json()) as { id: string; status: string };
}

/** Anexa PDF do currículo ao perfil profissional (multipart). */
export async function uploadMyJobResumePdf(params: {
  uri: string;
  fileName?: string;
  mimeType?: string;
}): Promise<JobCandidateProfile> {
  const token = (await ensureAuthTokenHydrated()) || getAuthToken();
  if (!token) throw new Error('Faça login para continuar.');

  const mime = params.mimeType?.trim() || 'application/pdf';
  const name = params.fileName?.trim() || 'curriculo.pdf';
  const form = new FormData();
  form.append('file', {
    uri: params.uri,
    name,
    type: mime,
  } as unknown as Blob);

  const base = getApiBaseUrl();
  const res = await fetch(`${base}${BASE}/me/candidate-profile/resume`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });
  if (!res.ok) throw new Error(await mapJobsAuthError(res, 'Erro ao enviar PDF'));
  return (await res.json()) as JobCandidateProfile;
}
