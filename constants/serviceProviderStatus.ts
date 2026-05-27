import type { ServiceProviderStatus } from '@/types/serviceProvider';

export type ServiceProviderStatusColor = 'warning' | 'info' | 'success' | 'error';

export const STATUS_UI: Record<
  ServiceProviderStatus,
  { label: string; color: ServiceProviderStatusColor; canEdit: boolean }
> = {
  PENDING: { label: 'Aguardando análise', color: 'warning', canEdit: true },
  UNDER_REVIEW: { label: 'Em análise', color: 'info', canEdit: true },
  APPROVED: { label: 'Aprovado', color: 'success', canEdit: false },
  REJECTED: { label: 'Recusado', color: 'error', canEdit: true },
};
