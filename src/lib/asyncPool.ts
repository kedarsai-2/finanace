/** Default concurrency for bulk API work (balance speed vs server load). */
export const BULK_IO_CONCURRENCY = 8;

/**
 * Run `fn` over `items` with at most `concurrency` promises in flight.
 * Order of `items` is preserved in the returned array.
 */
export async function asyncPool<T, R>(
  concurrency: number,
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const c = Math.max(1, Math.min(32, Math.floor(concurrency)));
  const ret: R[] = new Array(items.length);
  if (items.length === 0) return ret;
  let next = 0;
  const workers = Array.from({ length: Math.min(c, items.length) }, async () => {
    while (true) {
      const idx = next++;
      if (idx >= items.length) break;
      ret[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return ret;
}
