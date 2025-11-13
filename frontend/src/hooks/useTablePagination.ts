import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PaginationResult<T> {
  paginatedData: T[];
  pageInfo: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
  };
  goToPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
}

export function useTablePagination<T>(
  data: T[],
  defaultItemsPerPage: number = 50
): PaginationResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();
 
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [itemsPerPage, setItemsPerPageState] = useState(() => {
    const limitParam = searchParams.get('limit');
    return limitParam ? parseInt(limitParam, 10) : defaultItemsPerPage;
  });

  // Update URL when page/limit changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(currentPage));
    newParams.set('limit', String(itemsPerPage));
    setSearchParams(newParams, { replace: true });
  }, [currentPage, itemsPerPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const setItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPageState(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  return {
    paginatedData,
    pageInfo: {
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems: data.length,
      startIndex: (currentPage - 1) * itemsPerPage,
      endIndex: Math.min(currentPage * itemsPerPage, data.length)
    },
    goToPage,
    setItemsPerPage
  };
}
