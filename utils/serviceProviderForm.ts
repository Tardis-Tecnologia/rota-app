import type {
  ServiceProviderOwnerUpdateBody,
  ServiceProviderStatus,
  ServiceProviderSuperAdminUpdateBody,
} from '@/types/serviceProvider';

export const SERVICE_PROVIDER_SUPERADMIN_PROFILE = 'SUPERADMIN';

export function isServiceProviderSuperAdmin(profile: string | undefined | null): boolean {
  return profile?.trim().toUpperCase() === SERVICE_PROVIDER_SUPERADMIN_PROFILE;
}

export function editFooterHint(status: ServiceProviderStatus | null): string {
  if (status === 'APPROVED') {
    return 'Cadastro aprovado: as alterações entram em vigor na hora, sem nova moderação.';
  }
  if (status === 'REJECTED' || status === 'UNDER_REVIEW' || status === 'PENDING') {
    return 'Ao salvar, o cadastro volta para análise (status pendente).';
  }
  return 'As alterações podem passar por validação do administrativo.';
}

/** Converte horário vindo da API para texto no formulário. */
export function businessHoursFromApi(
  raw: Record<string, unknown> | string | null | undefined,
): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw !== 'object') return '';

  const candidates = ['description', 'notes', 'display', 'label', 'text'];
  for (const key of candidates) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  const schedule = raw.schedule ?? raw.hours;
  if (typeof schedule === 'string' && schedule.trim()) return schedule.trim();

  const parts = Object.entries(raw)
    .filter(([, value]) => value != null && String(value).trim() !== '')
    .map(([key, value]) => `${key}: ${String(value)}`);
  return parts.join(' · ');
}

/** API exige objeto; texto livre do formulário vira { description }. */
export function businessHoursToApi(text: string): Record<string, unknown> | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return { description: trimmed };
}

export interface ServiceProviderFormUpdateInput {
  name: string;
  categories: string[];
  description: string;
  phoneDigits: string;
  email: string;
  whatsappDigits?: string;
  cepDigits?: string;
  locationName: string;
  locationAddress: string;
  businessHoursText: string;
  imageId?: string;
}

/** Body do PATCH — sem CNPJ, type nem hostId (regra do dono). */
export function buildServiceProviderUpdateBody(
  input: ServiceProviderFormUpdateInput,
): ServiceProviderOwnerUpdateBody {
  const hours = businessHoursToApi(input.businessHoursText);
  const body: ServiceProviderOwnerUpdateBody = {
    name: input.name,
    categories: input.categories,
    description: input.description,
    phone: input.phoneDigits,
    email: input.email,
    locationName: input.locationName,
    locationAddress: input.locationAddress,
  };
  if (input.cepDigits) body.cep = input.cepDigits;
  const whatsapp = input.whatsappDigits?.trim();
  if (whatsapp) body.whatsapp = whatsapp;
  if (hours) body.businessHours = hours;
  if (input.imageId) body.imageId = input.imageId;
  return body;
}

export function buildServiceProviderSuperAdminExtras(
  extras: Pick<ServiceProviderSuperAdminUpdateBody, 'type' | 'hostId'>,
): Pick<ServiceProviderSuperAdminUpdateBody, 'type' | 'hostId'> {
  const out: Pick<ServiceProviderSuperAdminUpdateBody, 'type' | 'hostId'> = {};
  if (extras.type) out.type = extras.type;
  if (extras.hostId?.trim()) out.hostId = extras.hostId.trim();
  return out;
}
