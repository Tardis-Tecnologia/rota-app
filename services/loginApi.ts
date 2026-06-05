import { login, type LoginSuccess } from './authApi';
import { loginCommercial } from './commercialAuthApi';

export type LoginAccountKind = 'citizen' | 'commercial';

export type LoginWithEmailPasswordResult = LoginSuccess & {
  accountKind: LoginAccountKind;
  commercialCep?: string | null;
  commercialCnpj?: string | null;
};

function isCommercialLoginCredentialFailure(message: string): boolean {
  const m = message.trim().toLowerCase();
  return (
    m === 'email_ou_senha_incorretos' ||
    m === 'credenciais inválidas' ||
    m.includes('credenciais inválidas') ||
    m.includes('email ou senha')
  );
}

/** Tenta loja comercial antes do cidadão (mesmo e-mail pode existir nos dois cadastros). */
export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<LoginWithEmailPasswordResult> {
  try {
    const commercial = await loginCommercial(email, password);
    return { ...commercial, accountKind: 'commercial' };
  } catch (err) {
    if (!(err instanceof Error) || !isCommercialLoginCredentialFailure(err.message)) {
      throw err;
    }
  }

  const citizen = await login(email, password);
  return { ...citizen, accountKind: 'citizen' };
}
