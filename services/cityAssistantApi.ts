import { buildAuthHeaders, getApiBaseUrl } from '@/services/apiConfig';

export type AssistantAction = {
  id: string;
  label: string;
};

export type AssistantLink = {
  label: string;
  href: string;
};

export type AssistantReply = {
  text: string;
  sources: { label: string; detail?: string }[];
  links: AssistantLink[];
  actions: AssistantAction[];
  pendingDraftToken: string | null;
  phrasing: 'records' | 'model';
  modelConfigured: boolean;
};

type HistoryTurn = { role: 'user' | 'assistant'; text: string };

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
    if (Array.isArray(payload.message)) return payload.message.join(' ');
  } catch {
    // corpo vazio
  }
  return 'Não foi possível consultar os registros do município.';
}

async function postAssistant(path: string, body: unknown): Promise<AssistantReply> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: await buildAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as AssistantReply;
}

export function askCitizenAssistant(input: {
  message: string;
  history: HistoryTurn[];
  draftToken: string | null;
}): Promise<AssistantReply> {
  return postAssistant('/api/v1/assistant/citizen', {
    message: input.message,
    history: input.history.map((turn) => ({ ...turn, text: turn.text.slice(0, 1500) })),
    draftToken: input.draftToken ?? undefined,
  });
}

export function confirmCitizenReport(draftToken: string): Promise<AssistantReply> {
  return postAssistant('/api/v1/assistant/citizen/confirm', { draftToken });
}
