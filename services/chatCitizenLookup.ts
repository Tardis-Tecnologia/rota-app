import { formatCpf, isValidCpf, onlyCpfDigits } from '@/utils/cpf';

export type CitizenCpfCheck =
  | { ok: true; cpf: string; formatted: string; citizenName: string }
  | { ok: false; reason: 'invalid' | 'not_registered'; message: string };

/**
 * Confere o CPF digitado com o cadastro do usuário logado no ROTA.
 * Aceita 11 dígitos; se vierem 12 e os 11 primeiros forem o CPF da conta, também libera (typo comum).
 */
export function checkCitizenCpfAgainstSession(
  typedCpf: string,
  session: { name?: string | null; cpf?: string | null } | null | undefined,
): CitizenCpfCheck {
  const raw = onlyCpfDigits(typedCpf);
  const registered = onlyCpfDigits(session?.cpf);

  if (!registered || registered.length !== 11) {
    return {
      ok: false,
      reason: 'not_registered',
      message:
        'Não encontrei CPF no seu cadastro do ROTA. Atualize seus dados em Perfil e tente de novo.',
    };
  }

  const digits =
    raw.length === 12 && raw.startsWith(registered)
      ? registered
      : raw.length === 11
        ? raw
        : '';

  if (!digits) {
    return {
      ok: false,
      reason: 'invalid',
      message:
        'CPF inválido. Informe os 11 dígitos do CPF cadastrado na conta (somente números).',
    };
  }

  if (digits !== registered) {
    // Ainda avisa se o número nem passa no algoritmo e não é o da conta
    if (!isValidCpf(digits)) {
      return {
        ok: false,
        reason: 'invalid',
        message:
          'CPF inválido. Confira os 11 dígitos e tente novamente (somente números).',
      };
    }
    return {
      ok: false,
      reason: 'not_registered',
      message: `O CPF ${formatCpf(digits)} não corresponde ao cadastrado na sua conta ROTA. Use o CPF do titular da conta.`,
    };
  }

  return {
    ok: true,
    cpf: digits,
    formatted: formatCpf(digits),
    citizenName: session?.name?.trim() || 'Cidadão',
  };
}
