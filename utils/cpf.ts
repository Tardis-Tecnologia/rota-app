export function onlyCpfDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function isCpfWith11Digits(value: string | null | undefined): boolean {
  return onlyCpfDigits(value).length === 11;
}

export function formatCpf(value: string | null | undefined): string {
  const digits = onlyCpfDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Valida CPF com dígitos verificadores (rejeita sequências repetidas). */
export function isValidCpf(value: string | null | undefined): boolean {
  const cpf = onlyCpfDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i += 1) {
      total += Number(base[i]) * (factor - i);
    }
    const mod = (total * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}
