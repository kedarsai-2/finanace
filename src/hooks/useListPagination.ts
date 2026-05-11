import { useEffect, useMemo, useState } from "react";

export const DEFAULT_LIST_PAGE_SIZE = 100;

/**
 * Client-side pagination for filtered arrays. Resets to page 1 when `resetKey` changes.
 */
export function useListPagination<T>(
  items: readonly T[],
  resetKey: string,
  pageSize: number = DEFAULT_LIST_PAGE_SIZE,
) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, clampedPage, pageSize]);

  const rangeFrom = totalCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const rangeTo = Math.min(clampedPage * pageSize, totalCount);

  return {
    page: clampedPage,
    setPage,
    pageSize,
    totalPages,
    totalCount,
    pageItems,
    rangeFrom,
    rangeTo,
  };
}
