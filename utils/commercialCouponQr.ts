import { normalizeCommercialCouponCode } from '@/services/commercialCouponsApi';

export type CommercialCouponQrPayload = {
  code: string;
  userId?: string;
};

/** Interpreta QR/código escaneado (JSON ou texto puro). */
export function parseCommercialCouponQr(raw: string): CommercialCouponQrPayload {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('QR Code vazio.');
  }

  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed) as Record<string, unknown>;
      const codeRaw = data.code ?? data.couponCode;
      const code =
        typeof codeRaw === 'string' ? normalizeCommercialCouponCode(codeRaw) : '';
      const userIdRaw = data.userId;
      const userId =
        typeof userIdRaw === 'string' && userIdRaw.trim() ? userIdRaw.trim() : undefined;
      if (code) {
        return { code, userId };
      }
    } catch {
      /* tenta como código simples */
    }
  }

  return { code: normalizeCommercialCouponCode(trimmed) };
}

export function buildCommercialCouponQrPayload(
  code: string,
  userId?: string,
): string {
  const payload: CommercialCouponQrPayload = {
    code: normalizeCommercialCouponCode(code),
  };
  if (userId?.trim()) {
    payload.userId = userId.trim();
  }
  return JSON.stringify(payload);
}

export function buildCouponQrImageUri(data: string, size = 192): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
