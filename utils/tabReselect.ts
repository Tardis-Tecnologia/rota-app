type TabReselectListener = () => void;

const listeners = new Map<string, Set<TabReselectListener>>();

export function subscribeTabReselect(tab: string, listener: TabReselectListener): () => void {
  const bucket = listeners.get(tab) ?? new Set<TabReselectListener>();
  bucket.add(listener);
  listeners.set(tab, bucket);
  return () => {
    bucket.delete(listener);
  };
}

export function emitTabReselect(tab: string): void {
  listeners.get(tab)?.forEach((listener) => listener());
}
