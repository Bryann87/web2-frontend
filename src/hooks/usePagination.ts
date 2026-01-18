import { useState, useCallback } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
}

export const usePagination = ({
  initialPage = 1,
  initialPageSize = 10,
}: UsePaginationProps = {}) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = useCallback(() => setPage((prev) => prev + 1), []);

  const prevPage = useCallback(
    () => setPage((prev) => Math.max(1, prev - 1)),
    []
  );

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1) {
      setPage(newPage);
    }
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const getPaginationParams = useCallback(
    () => ({
      page,
      pageSize,
    }),
    [page, pageSize]
  );

  return {
    page,
    pageSize,
    setPage,
    setPageSize: changePageSize,
    nextPage,
    prevPage,
    goToPage,
    resetPage,
    getPaginationParams,
  };
};
