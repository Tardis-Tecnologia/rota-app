const STORAGE_PREFIX = '@rota/stream-chat-cleared';

type ClearedEntry = {
  cid: string;
  clearedAt: string;
};

let memoryByUser = new Map<string, ClearedEntry[]>();

async function getAsyncStorage() {
  try {
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId.trim()}`;
}

async function readAll(userId: string): Promise<ClearedEntry[]> {
  const uid = userId.trim();
  if (!uid) return [];
  if (memoryByUser.has(uid)) return memoryByUser.get(uid)!;

  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return [];

  try {
    const raw = await AsyncStorage.getItem(storageKey(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ClearedEntry[];
    const entries = Array.isArray(parsed) ? parsed : [];
    memoryByUser.set(uid, entries);
    return entries;
  } catch {
    return [];
  }
}

async function writeAll(userId: string, entries: ClearedEntry[]): Promise<void> {
  const uid = userId.trim();
  if (!uid) return;
  memoryByUser.set(uid, entries);
  const AsyncStorage = await getAsyncStorage();
  if (!AsyncStorage) return;
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(entries));
}

export async function markStreamChannelCleared(userId: string, cid: string): Promise<Date> {
  const clearedAt = new Date();
  const entries = await readAll(userId);
  const next = [...entries.filter((entry) => entry.cid !== cid), { cid, clearedAt: clearedAt.toISOString() }];
  await writeAll(userId, next);
  return clearedAt;
}

export async function getStreamChannelClearedAt(userId: string, cid: string): Promise<Date | null> {
  const entries = await readAll(userId);
  const found = entries.find((entry) => entry.cid === cid);
  if (!found?.clearedAt) return null;
  const date = new Date(found.clearedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getStreamChannelClearedMap(userId: string): Promise<Record<string, string>> {
  const entries = await readAll(userId);
  return Object.fromEntries(entries.map((entry) => [entry.cid, entry.clearedAt]));
}

export function filterMessagesAfterClear<T extends { timestamp: Date }>(
  messages: T[],
  clearedAt: Date | null | undefined,
): T[] {
  if (!clearedAt) return messages;
  const cutoff = clearedAt.getTime();
  return messages.filter((message) => message.timestamp.getTime() > cutoff);
}

export function effectiveStreamLastMessage(
  messages: Array<{ text?: string; created_at?: string | Date }>,
  clearedAt: Date | null | undefined,
): string {
  if (!clearedAt) {
    const last = messages[messages.length - 1];
    return last?.text?.trim() || '';
  }
  const cutoff = clearedAt.getTime();
  const visible = messages.filter((message) => {
    if (!message.created_at) return false;
    const time = new Date(message.created_at).getTime();
    return !Number.isNaN(time) && time > cutoff;
  });
  const last = visible[visible.length - 1];
  return last?.text?.trim() || '';
}
