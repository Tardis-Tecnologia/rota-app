import { login, type LoginSuccess } from './authApi';
import { loginCommercial } from './commercialAuthApi';

export type LoginAccountKind = 'citizen' | 'commercial';

export type LoginWithEmailPasswordResult = LoginSuccess & {
  accountKind: LoginAccountKind;
  commercialCep?: string | null;
  commercialCnpj?: string | null;
};

function shouldFallbackToCitizenLogin(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const m = error.message.trim().toLowerCase();
  return (
    m === 'email_ou_senha_incorretos' ||
    m.includes('credenciais inválidas') ||
    m.includes('credenciais invalidas') ||
    m.includes('email ou senha') ||
    m.includes('unauthorized') ||
    /\b401\b/.test(m)
  );
}

/** Tenta loja comercial antes do cidadão (mesmo e-mail pode existir nos dois cadastros). */
export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<LoginWithEmailPasswordResult> {
  const emailNorm = email.trim().toLowerCase();
  try {
    const commercial = await loginCommercial(emailNorm, password);
    return { ...commercial, accountKind: 'commercial' };
  } catch (err) {
    // Conta só de cidadão: o comércio responde 401 e seguimos para /auth/login.
    if (!shouldFallbackToCitizenLogin(err)) {
      throw err;
    }
  }

  const citizen = await login(emailNorm, password);
  return { ...citizen, accountKind: 'citizen' };
}
