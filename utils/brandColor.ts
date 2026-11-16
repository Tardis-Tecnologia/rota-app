const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const DEFAULT_BRAND_GRADIENT = ['#1D4ED8', '#2563EB', '#14B8A6'] as const;

export function normalizeHex(color: string | null | undefined): string | null {
  const value = color?.trim() ?? '';
  const match = value.match(HEX);
  if (!match) return null;
  if (match[1].length === 3) {
    return `#${match[1]
      .split('')
      .map((char) => char + char)
      .join('')}`.toLowerCase();
  }
  return `#${match[1].toLowerCase()}`;
}

function shade(hex: string, amount: number): string {
  const channels = [0, 2, 4].map((index) => parseInt(hex.slice(index + 1, index + 3), 16));
  const mixed = channels.map((channel) => {
    const next = amount < 0 ? channel * (1 + amount) : channel + (255 - channel) * amount;
    return Math.max(0, Math.min(255, Math.round(next)));
  });
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function luminance(hex: string): number {
  const channels = [0, 2, 4].map((index) => {
    const value = parseInt(hex.slice(index + 1, index + 3), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Três tons da cor institucional, escuros o bastante para texto e ícones brancos. */
export function brandGradient(color: string | null | undefined): readonly [string, string, string] {
  const hex = normalizeHex(color);
  if (!hex) return DEFAULT_BRAND_GRADIENT;
  const lum = luminance(hex);
  const shift = lum > 0.55 ? -0.3 : lum > 0.4 ? -0.14 : 0;
  const mid = shade(hex, shift);
  return [shade(mid, -0.1), mid, shade(mid, -0.24)];
}
