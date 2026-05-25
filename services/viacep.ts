export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  erro?: boolean;
}

/** Mantém só dígitos (máx. 8). */
export function cepDigitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

/** Máscara visual: 00000-000 */
export function formatCepDisplay(digits: string): string {
  const d = cepDigitsOnly(digits);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function buildAddressFromViaCep(data: ViaCepAddress): string {
  const parts: string[] = [];
  if (data.logradouro?.trim()) parts.push(data.logradouro.trim());
  if (data.bairro?.trim()) parts.push(data.bairro.trim());
  const cityUf = [data.localidade?.trim(), data.uf?.trim()].filter(Boolean).join(' - ');
  if (cityUf) parts.push(cityUf);
  return parts.join(', ');
}

export function buildLocationNameFromViaCep(data: ViaCepAddress): string {
  if (data.bairro?.trim()) return data.bairro.trim();
  if (data.logradouro?.trim()) return data.logradouro.trim();
  return data.localidade?.trim() || '';
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress> {
  const digits = cepDigitsOnly(cep);
  if (digits.length !== 8) {
    throw new Error('Informe um CEP com 8 dígitos.');
  }

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Não foi possível consultar o CEP. Tente novamente.');
  }

  const data = (await res.json()) as ViaCepAddress;
  if (data.erro) {
    throw new Error('CEP não encontrado.');
  }

  return data;
}
