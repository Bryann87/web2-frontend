import { apiRequest, ENDPOINTS, buildQueryParams } from '@/config/api';
import {
  Persona,
  PersonaCreate,
  PersonaUpdate,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface PersonaFilters {
  busqueda?: string;
  activo?: boolean;
}

export const personasService = {
  // GET /api/Personas con filtro opcional por rol
  async getAll(
    params: PaginationParams = {},
    rol?: string,
    filters: PersonaFilters = {},
  ): Promise<PaginatedResponse<Persona>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      rol,
      ...filters,
    });

    const response: ApiResponse<PaginatedResponse<Persona>> = await apiRequest(
      `${ENDPOINTS.PERSONAS}${queryParams}`,
    );

    return response.data!;
  },

  // GET /api/Personas/estudiantes
  async getEstudiantes(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Persona>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    });

    const response: ApiResponse<PaginatedResponse<Persona>> = await apiRequest(
      `${ENDPOINTS.PERSONAS}/estudiantes${queryParams}`,
    );

    return response.data!;
  },

  // GET /api/Personas/profesores
  async getProfesores(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Persona>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    });

    const response: ApiResponse<PaginatedResponse<Persona>> = await apiRequest(
      `${ENDPOINTS.PERSONAS}/profesores${queryParams}`,
    );

    return response.data!;
  },

  // GET /api/Personas/representantes
  async getRepresentantes(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Persona>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    });

    const response: ApiResponse<PaginatedResponse<Persona>> = await apiRequest(
      `${ENDPOINTS.PERSONAS}/representantes${queryParams}`,
    );

    return response.data!;
  },

  // GET /api/Personas/estudiante/{id}/representantes
  async getRepresentantesDeEstudiante(
    idEstudiante: number,
  ): Promise<Persona[]> {
    const response: ApiResponse<Persona[]> = await apiRequest(
      `${ENDPOINTS.PERSONAS}/estudiante/${idEstudiante}/representantes`,
    );
    return response.data!;
  },

  async getById(id: number): Promise<Persona> {
    const response: ApiResponse<Persona> = await apiRequest(
      `${ENDPOINTS.PERSONAS}/${id}`,
    );

    return response.data!;
  },

  async create(personaData: PersonaCreate): Promise<Persona> {
    const response: ApiResponse<Persona> = await apiRequest(
      ENDPOINTS.PERSONAS,
      {
        method: 'POST',
        body: JSON.stringify(personaData),
      },
    );

    return response.data!;
  },

  async update(id: number, personaData: PersonaUpdate): Promise<Persona> {
    const response: ApiResponse<Persona> = await apiRequest(
      `${ENDPOINTS.PERSONAS}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(personaData),
      },
    );

    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`${ENDPOINTS.PERSONAS}/${id}`, {
      method: 'DELETE',
    });
  },

  // PUT /api/Personas/{id}/toggle-activo
  async toggleActivo(id: number): Promise<Persona> {
    const response: ApiResponse<Persona> = await apiRequest(
      `${ENDPOINTS.PERSONAS}/${id}/toggle-activo`,
      {
        method: 'PUT',
      },
    );
    return response.data!;
  },

  // PUT /api/Personas/{id}/cambiar-password
  async cambiarPassword(id: number, nuevaContraseña: string): Promise<void> {
    await apiRequest(`${ENDPOINTS.PERSONAS}/${id}/cambiar-password`, {
      method: 'PUT',
      body: JSON.stringify({ nuevaContraseña }),
    });
  },
};
