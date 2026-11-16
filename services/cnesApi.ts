import { currentHostId, publicServicesOptionalAuthRequest } from './publicServicesHttp';

const CNES_TIMEOUT_MS = 120_000;

export interface CnesEstablishment {
  cnes: string;
  name: string;
  typeCode: number;
  typeName: string;
  kind: 'ubs' | 'hospital' | 'other';
  address: string | null;
  neighborhood: string | null;
  cep: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinateSource: 'cnes' | null;
  schedulingAvailable: false;
}

export interface CnesServiceItem {
  serviceCode: string;
  classification: string;
  description: string;
  susOutpatient: string | null;
  susHospital: string | null;
  characteristic: string | null;
}

export interface CnesMeta {
  hostId: string;
  ibgeCode: string | null;
  municipalityCode: string | null;
  source: string;
  sourceNote: string;
  sourceUrl: string | null;
  fetchedAt: string | null;
  status: string;
  truncated: boolean;
  notice: string | null;
  bedsAvailable: false;
  bedsNotice: string;
  schedulingAvailable: false;
}

export interface CnesSummary extends CnesMeta {
  total: number;
  ubs: number;
  hospitals: number;
  byType: { typeCode: number; typeName: string; count: number }[];
}

export interface CnesList extends CnesMeta {
  total: number;
  pageSize: number;
  offset: number;
  items: CnesEstablishment[];
}

export interface CnesDetail extends CnesMeta, CnesEstablishment {
  legalName: string | null;
  email: string | null;
  shiftDescription: string | null;
  hasSurgicalCenter: boolean;
  hasObstetricCenter: boolean;
  hasNeonatalCenter: boolean;
  hasHospitalCare: boolean;
  hasSupportService: boolean;
  hasOutpatientCare: boolean;
  sourceUpdatedAt: string | null;
  servicesNotice: string | null;
  services: CnesServiceItem[];
}

function query(extra?: Record<string, string | number | undefined>) {
  return { hostId: currentHostId(), ...extra };
}

export function getCnesSummary(): Promise<CnesSummary> {
  return publicServicesOptionalAuthRequest<CnesSummary>('/health/cnes/summary', {
    query: query(),
    timeoutMs: CNES_TIMEOUT_MS,
  });
}

export function getCnesEstablishments(params: {
  q?: string;
  kind?: string;
  limit?: number;
  offset?: number;
}): Promise<CnesList> {
  return publicServicesOptionalAuthRequest<CnesList>('/health/cnes/establishments', {
    query: query(params),
    timeoutMs: CNES_TIMEOUT_MS,
  });
}

export function getCnesEstablishment(cnes: string): Promise<CnesDetail> {
  return publicServicesOptionalAuthRequest<CnesDetail>(`/health/cnes/establishments/${encodeURIComponent(cnes)}`, {
    query: query(),
    timeoutMs: CNES_TIMEOUT_MS,
  });
}

export const CNES_KIND_LABEL: Record<CnesEstablishment['kind'], string> = {
  ubs: 'UBS',
  hospital: 'Hospital',
  other: 'Outro',
};

export function cnesMarkerColor(kind: CnesEstablishment['kind']): string {
  if (kind === 'ubs') return '#0284C7';
  if (kind === 'hospital') return '#BE123C';
  return '#0F766E';
}
