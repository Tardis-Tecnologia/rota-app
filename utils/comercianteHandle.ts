/** Gera handle estilo @lojademorota a partir do e-mail da loja. */
export function emailToStoreHandle(email: string): string {
  const local = (email.split('@')[0] ?? 'loja').trim();
  const slug = local.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `@${slug || 'loja'}`;
}
