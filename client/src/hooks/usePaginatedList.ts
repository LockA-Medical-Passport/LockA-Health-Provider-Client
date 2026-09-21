import { useCallback, useState } from 'react';
import type { PageParams, PagedResult } from '../lib/types';
import { useAsyncResource } from './useAsyncResource';

export function usePaginatedList<T>(fetchPage: (params: PageParams) => Promise<PagedResult<T>>) {
  const [requestedPage, setRequestedPage] = useState(1);
  const loader = useCallback(() => fetchPage({ page: requestedPage, pageSize: 10 }), [fetchPage, requestedPage]);
  const resource = useAsyncResource(loader);
  const page = resource.data?.page ?? 1;

  return {
    ...resource,
    items: resource.data?.items ?? [],
    initialLoading: resource.loading && !resource.data,
    requestedPage,
    page,
    pageSize: resource.data?.pageSize ?? 10,
    total: resource.data?.total ?? 0,
    hasMore: resource.data?.hasMore ?? false,
    next: () => setRequestedPage(page + 1),
    previous: () => setRequestedPage(Math.max(1, page - 1)),
    refresh: () => {
      setRequestedPage(1);
      resource.reload();
    },
  };
}
