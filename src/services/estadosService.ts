import { apiRequest, ENDPOINTS } from '@/config/api';
import { Estado, EstadoCreate, EstadoUpdate, ApiResponse } from '@/types';

export const estadosService = {
  async getAll(): Promise<Estado[]> {
    const response: ApiResponse<Estado[]> = await apiRequest(ENDPOINTS.ESTADOS);

    return response.data!;
  },

  async getById(id: number): Promise<Estado> {
    const response: ApiResponse<Estado> = await apiRequest(
      `${ENDPOINTS.ESTADOS}/${id}`
    );

    return response.data!;
  },

  async create(estadoData: EstadoCreate): Promise<Estado> {
    const response: ApiResponse<Estado> = await apiRequest(ENDPOINTS.ESTADOS, {
      method: 'POST',
      body: JSON.stringify(estadoData),
    });

    return response.data!;
  },

  async update(id: number, estadoData: EstadoUpdate): Promise<Estado> {
    const response: ApiResponse<Estado> = await apiRequest(
      `${ENDPOINTS.ESTADOS}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(estadoData),
      }
    );

    return response.data!;
  },

  async delete(id: number): Promise<void> {
    const response: ApiResponse<any> = await apiRequest(
      `${ENDPOINTS.ESTADOS}/${id}`,
      {
        method: 'DELETE',
      }
    );
  },
};
