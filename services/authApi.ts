const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const BASE_PATH = '/api/v1';

export interface LoginSuccess {
  token: string;
  userId: string;
  profile: string;
  themeSlug: string | null;
}

let authToken: string | null = null;

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL não definida');
  }
  return API_BASE_URL.replace(/\/$/, '');
}

export async function login(
  email: string,
  password: string
): Promise<LoginSuccess> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  if (res.status === 401) {
    throw new Error('EMAIL_OU_SENHA_INCORRETOS');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro no login: ${res.status}`);
  }

  const data = (await res.json()) as LoginSuccess;
  if (!data?.token) {
    throw new Error('Resposta inválida do servidor');
  }
  return data;
}

function parseApiErrorBody(text: string): string {
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(j.message)) {
      return j.message.join(', ');
    }
    if (typeof j.message === 'string') {
      return j.message;
    }
  } catch {
    /* ignore */
  }
  return text || 'Erro inesperado';
}

export async function registerCitizen(
  name: string,
  email: string,
  password: string,
  govbrSub?: string,
): Promise<void> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/users/register`;
  const body: { name: string; email: string; password: string; govbrSub?: string } = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  };
  if (govbrSub?.trim()) {
    body.govbrSub = govbrSub.trim();
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 409) {
      throw new Error('EMAIL_JA_CADASTRADO');
    }
    throw new Error(parseApiErrorBody(text) || `Erro no cadastro: ${res.status}`);
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/forgot-password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro ao enviar código: ${res.status}`);
  }

  return (await res.json()) as { message: string };
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<{ valid: true }> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/verify-reset-code`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code: code.trim(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro ao validar código: ${res.status}`);
  }

  return (await res.json()) as { valid: true };
}

export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  const url = `${getApiBaseUrl()}${BASE_PATH}/auth/reset-password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorBody(text) || `Erro ao redefinir senha: ${res.status}`);
  }

  return (await res.json()) as { message: string };
}