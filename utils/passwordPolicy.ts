/** Alinhado ao backend: mínimo 6 caracteres, 1 maiúscula (A-Z) e 1 número. */
export function getPasswordPolicyError(password: string): string | undefined {
  if (!password) {
    return 'A senha é obrigatória.';
  }
  if (password.length < 6) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Inclua pelo menos uma letra maiúscula (A-Z).';
  }
  if (!/\d/.test(password)) {
    return 'Inclua pelo menos um número.';
  }
  return undefined;
}

export const PASSWORD_PLACEHOLDER = 'Ex.: Senha123 (maiúscula e número)';
