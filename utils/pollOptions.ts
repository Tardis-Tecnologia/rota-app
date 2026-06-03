export function labelFromPollOptionEntry(x: unknown): string {
  if (x == null) return '';
  if (typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean') {
    return String(x).trim();
  }
  if (typeof x === 'object' && !Array.isArray(x)) {
    const o = x as Record<string, unknown>;
    const cand = o.text ?? o.label ?? o.title ?? o.name ?? o.value;
    if (typeof cand === 'string' || typeof cand === 'number') {
      return String(cand).trim();
    }
  }
  const s = String(x).trim();
  return s === '[object Object]' ? '' : s;
}

export function parsePollOptions(raw: unknown): string[] {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      value = JSON.parse(t) as unknown;
    } catch {
      return [t];
    }
  }
  if (Array.isArray(value)) {
    return value.map(labelFromPollOptionEntry).filter((s) => s.length > 0);
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const key of ['options', 'items', 'choices', 'labels'] as const) {
      const inner = o[key];
      if (Array.isArray(inner)) {
        return inner.map(labelFromPollOptionEntry).filter((s) => s.length > 0);
      }
    }
  }
  return [];
}
