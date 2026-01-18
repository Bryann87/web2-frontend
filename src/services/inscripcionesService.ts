import { apiRequest, ENDPOINTS, buildQueryParams } from '@/config/api';
import {
  Inscripcion,
  InscripcionCreate,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface InscripcionFilters {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export const inscripcionesService = {
  async getAll(
    params: PaginationParams = {},
    filters: InscripcionFilters = {},
  ): Promise<PaginatedResponse<Inscripcion>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ...filters,
    });

    const response: ApiResponse<PaginatedResponse<Inscripcion>> =
      await apiRequest(`${ENDPOINTS.INSCRIPCIONES}${queryParams}`);

    return response.data!;
  },

  async getById(id: number): Promise<Inscripcion> {
    const response: ApiResponse<Inscripcion> = await apiRequest(
      `${ENDPOINTS.INSCRIPCIONES}/${id}`,
    );

    return response.data!;
  },

  async create(inscripcionData: InscripcionCreate): Promise<Inscripcion> {
    const response: ApiResponse<Inscripcion> = await apiRequest(
      ENDPOINTS.INSCRIPCIONES,
      {
        method: 'POST',
        body: JSON.stringify(inscripcionData),
      },
    );

    return response.data!;
  },

  async update(
    id: number,
    inscripcionData: Partial<InscripcionCreate>,
  ): Promise<Inscripcion> {
    const response: ApiResponse<Inscripcion> = await apiRequest(
      `${ENDPOINTS.INSCRIPCIONES}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(inscripcionData),
      },
    );

    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`${ENDPOINTS.INSCRIPCIONES}/${id}`, {
      method: 'DELETE',
    });
  },

  async getByClase(claseId: number): Promise<Inscripcion[]> {
    const response: ApiResponse<Inscripcion[]> = await apiRequest(
      ENDPOINTS.INSCRIPCIONES_BY_CLASE(claseId),
    );

    return response.data || [];
  },
};
