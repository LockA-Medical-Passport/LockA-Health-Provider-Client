import type { PagedResult } from '../lib/types';

export function paged<T>(items: T[], total = items.length, page = 1, pageSize = 10): PagedResult<T> {
  return { items, total, page, pageSize, hasMore: page * pageSize < total };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
