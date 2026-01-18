import { apiRequest, ENDPOINTS, buildQueryParams } from '@/config/api';
import {
  Clase,
  ClaseCreate,
  ClaseUpdate,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export const clasesService = {
  async getAll(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Clase>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    });

    const response: ApiResponse<PaginatedResponse<Clase>> = await apiRequest(
      `${ENDPOINTS.CLASES}${queryParams}`,
    );

    if (!response.data) {
      throw new Error('No se recibieron datos de la API');
    }

    return response.data!;
  },

  async getById(id: number): Promise<Clase> {
    const response: ApiResponse<Clase> = await apiRequest(
      `${ENDPOINTS.CLASES}/${id}`,
    );

    return response.data!;
  },

  async getByProfesor(profesorId: number): Promise<Clase[]> {
    const response: ApiResponse<Clase[]> = await apiRequest(
      ENDPOINTS.CLASES_BY_PROFESOR(profesorId),
    );

    if (!response.data) {
      throw new Error('No se recibieron datos de la API');
    }

    return response.data!;
  },

  async create(claseData: ClaseCreate): Promise<Clase> {
    // Convert hora from "HH:mm" to TimeSpan format "HH:mm:ss"
    const formattedData = {
      ...claseData,
      hora:
        claseData.hora.includes(':') && claseData.hora.split(':').length === 2
          ? `${claseData.hora}:00`
          : claseData.hora,
    };

    const response: ApiResponse<Clase> = await apiRequest(ENDPOINTS.CLASES, {
      method: 'POST',
      body: JSON.stringify(formattedData),
    });

    return response.data!;
  },

  async update(id: number, claseData: ClaseUpdate): Promise<Clase> {
    // Convert hora from "HH:mm" to TimeSpan format "HH:mm:ss"
    const formattedData = {
      ...claseData,
      hora:
        claseData.hora.includes(':') && claseData.hora.split(':').length === 2
          ? `${claseData.hora}:00`
          : claseData.hora,
    };

    const response: ApiResponse<Clase> = await apiRequest(
      `${ENDPOINTS.CLASES}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(formattedData),
      },
    );

    return response.data!;
  },

  async delete(id: number): Promise<void> {
    const response: ApiResponse<any> = await apiRequest(
      `${ENDPOINTS.CLASES}/${id}`,
      {
        method: 'DELETE',
      },
    );
  },

  async getEstudiantes(claseId: number): Promise<any[]> {
    const response: ApiResponse<any[]> = await apiRequest(
      ENDPOINTS.CLASES_ESTUDIANTES(claseId),
    );

    return response.data || [];
  },
};
