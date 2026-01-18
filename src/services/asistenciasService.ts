import {
  apiRequest,
  ENDPOINTS,
  buildQueryParams,
  API_CONFIG,
} from '@/config/api';
import {
  Asistencia,
  AsistenciaCreate,
  AsistenciaUpdate,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export interface AsistenciaFilters {
  fechaInicio?: string;
  fechaFin?: string;
  idInscripcion?: number;
  idEstudiante?: number;
  idClase?: number;
  estadoAsis?: string;
}

export interface ValidacionAsistencia {
  puedeRegistrar: boolean;
  mensaje: string;
  diaSemanaClase: string;
  diaActual: string;
  yaRegistradaEstaSemana: boolean;
  fechaUltimaAsistencia?: string;
  proximaFechaDisponible?: string;
}

export const asistenciasService = {
  async getAll(
    params: PaginationParams = {},
    filters: AsistenciaFilters = {}
  ): Promise<PaginatedResponse<Asistencia>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ...filters,
    });

    const response: ApiResponse<PaginatedResponse<Asistencia>> =
      await apiRequest(`${ENDPOINTS.ASISTENCIAS}${queryParams}`);

    return response.data!;
  },

  async getById(id: number): Promise<Asistencia> {
    const response: ApiResponse<Asistencia> = await apiRequest(
      `${ENDPOINTS.ASISTENCIAS}/${id}`
    );

    return response.data!;
  },

  async getByClase(claseId: number, fecha?: string): Promise<Asistencia[]> {
    const response: ApiResponse<Asistencia[]> = await apiRequest(
      ENDPOINTS.ASISTENCIAS_BY_CLASE(claseId, fecha)
    );

    return response.data!;
  },

  async validarAsistencia(claseId: number): Promise<ValidacionAsistencia> {
    const response: ApiResponse<ValidacionAsistencia> = await apiRequest(
      `${ENDPOINTS.ASISTENCIAS}/clase/${claseId}/validar`
    );

    return response.data!;
  },

  async getByEstudiante(
    estudianteId: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<Asistencia[]> {
    const response: ApiResponse<Asistencia[]> = await apiRequest(
      ENDPOINTS.ASISTENCIAS_BY_ESTUDIANTE(estudianteId, fechaInicio, fechaFin)
    );

    return response.data!;
  },

  async getByInscripcion(
    inscripcionId: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<Asistencia[]> {
    const params = buildQueryParams({ fechaInicio, fechaFin });
    const response: ApiResponse<Asistencia[]> = await apiRequest(
      `${ENDPOINTS.ASISTENCIAS}/inscripcion/${inscripcionId}${params}`
    );
    return response.data!;
  },

  async create(asistenciaData: AsistenciaCreate): Promise<Asistencia> {
    const response: ApiResponse<Asistencia> = await apiRequest(
      ENDPOINTS.ASISTENCIAS,
      {
        method: 'POST',
        body: JSON.stringify(asistenciaData),
      }
    );

    return response.data!;
  },

  async update(
    id: number,
    asistenciaData: AsistenciaUpdate
  ): Promise<Asistencia> {
    const response: ApiResponse<Asistencia> = await apiRequest(
      `${ENDPOINTS.ASISTENCIAS}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(asistenciaData),
      }
    );

    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`${ENDPOINTS.ASISTENCIAS}/${id}`, {
      method: 'DELETE',
    });
  },

  // Método para registrar asistencia rápida
  async registrarAsistencia(
    idEstudiante: number,
    idClase: number,
    estadoAsis: string = 'presente',
    fechaAsis?: string
  ): Promise<Asistencia> {
    const asistenciaData: AsistenciaCreate = {
      idEstudiante,
      idClase,
      estadoAsis,
      fechaAsis: fechaAsis || new Date().toISOString(),
    };

    return this.create(asistenciaData);
  },

  // Descargar reporte CSV
  async descargarReporteCsv(filters: AsistenciaFilters = {}): Promise<void> {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const queryParams = buildQueryParams(filters);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.ASISTENCIAS}/reporte/csv${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al descargar reporte');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_asistencias_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Descargar reporte JSON
  async descargarReporteJson(filters: AsistenciaFilters = {}): Promise<void> {
    const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
    const queryParams = buildQueryParams(filters);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${ENDPOINTS.ASISTENCIAS}/reporte/json${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al descargar reporte');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_asistencias_${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
