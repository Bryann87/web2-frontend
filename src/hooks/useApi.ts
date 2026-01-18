import { useState, useEffect } from 'react';
import { PaginatedResponse } from '@/types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

export const useApi = <T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = { immediate: true }
) => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = async (): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  };

  const reset = () => {
    setState({ data: null, loading: false, error: null });
  };

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

// Hook específico para operaciones CRUD
export const useCrud = <
  T,
  CreateT = Partial<T>,
  UpdateT = Partial<T>
>(service: {
  getAll: (params?: any) => Promise<any>;
  getById: (id: number) => Promise<T>;
  create: (data: CreateT) => Promise<T>;
  update: (id: number, data: UpdateT) => Promise<T>;
  delete: (id: number) => Promise<void>;
}) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async (params?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await service.getAll(params);
      setItems(response.data || response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: CreateT): Promise<T | null> => {
    try {
      const newItem = await service.create(data);
      setItems((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
      return null;
    }
  };

  const updateItem = async (id: number, data: UpdateT): Promise<T | null> => {
    try {
      const updatedItem = await service.update(id, data);
      setItems((prev) =>
        prev.map((item) =>
          (item as any).id === id ||
          (item as any).idPersona === id ||
          (item as any).idAlumno === id ||
          (item as any).idProfesor === id ||
          (item as any).idClase === id
            ? updatedItem
            : item
        )
      );
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      return null;
    }
  };

  const deleteItem = async (id: number): Promise<boolean> => {
    try {
      await service.delete(id);
      setItems((prev) =>
        prev.filter(
          (item) =>
            (item as any).id !== id &&
            (item as any).idPersona !== id &&
            (item as any).idAlumno !== id &&
            (item as any).idProfesor !== id &&
            (item as any).idClase !== id
        )
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      return false;
    }
  };

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    setError,
  };
};

// Hook para APIs paginadas
export const usePaginatedApi = <T>(
  apiFunction: (params?: any) => Promise<PaginatedResponse<T>>,
  initialPageSize: number = 10
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [pageSize] = useState(initialPageSize);

  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction({ page, pageSize });
      setData(result.data || []);
      setTotalPages(result.totalPages || 0);
      setTotalRecords(result.totalRecords || 0);
      setHasNextPage(result.hasNextPage || false);
      setHasPreviousPage(result.hasPreviousPage || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setData([]);
      setTotalPages(0);
      setTotalRecords(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  useEffect(() => {
    refetch();
  }, [page, pageSize]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    totalRecords,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    refetch,
  };
};
