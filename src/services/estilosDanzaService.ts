import { apiRequest, ENDPOINTS, buildQueryParams } from '@/config/api';
import {
  EstiloDanza,
  EstiloDanzaCreate,
  EstiloDanzaUpdate,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export const estilosDanzaService = {
  async getAll(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<EstiloDanza>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    });

    const response: ApiResponse<PaginatedResponse<EstiloDanza>> =
      await apiRequest(`${ENDPOINTS.ESTILOS_DANZA}${queryParams}`);

    return response.data!;
  },

  async getById(id: number): Promise<EstiloDanza> {
    const response: ApiResponse<EstiloDanza> = await apiRequest(
      `${ENDPOINTS.ESTILOS_DANZA}/${id}`
    );

    return response.data!;
  },

  async create(estiloData: EstiloDanzaCreate): Promise<EstiloDanza> {
    const response: ApiResponse<EstiloDanza> = await apiRequest(
      ENDPOINTS.ESTILOS_DANZA,
      {
        method: 'POST',
        body: JSON.stringify(estiloData),
      }
    );

    return response.data!;
  },

  async update(
    id: number,
    estiloData: EstiloDanzaUpdate
  ): Promise<EstiloDanza> {
    const response: ApiResponse<EstiloDanza> = await apiRequest(
      `${ENDPOINTS.ESTILOS_DANZA}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(estiloData),
      }
    );

    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`${ENDPOINTS.ESTILOS_DANZA}/${id}`, {
      method: 'DELETE',
    });
  },

  // Método para obtener solo estilos activos
  async getActivos(): Promise<EstiloDanza[]> {
    const response = await this.getAll({ pageSize: 100 });
    return response.data.filter((estilo) => estilo.activo);
  },
};
