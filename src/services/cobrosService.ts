import { apiRequest, ENDPOINTS, buildQueryParams } from '@/config/api';
import {
  Cobro,
  CobroCreate,
  CobroUpdate,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  EstadoPagoEstudiante,
  ResumenPagoEstudiante,
} from '@/types';

export interface CobroFilters {
  idEstudiante?: number;
  estadoCobro?: string;
  tipoCobro?: string;
  mesCorrespondiente?: string;
  anioCorrespondiente?: number;
  metodoPago?: string;
  busqueda?: string;
}

export const cobrosService = {
  async getAll(
    params: PaginationParams = {},
    filters: CobroFilters = {}
  ): Promise<PaginatedResponse<Cobro>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ...filters,
    });

    const response: ApiResponse<PaginatedResponse<Cobro>> = await apiRequest(
      `${ENDPOINTS.COBROS}${queryParams}`
    );

    return response.data!;
  },

  async getById(id: number): Promise<Cobro> {
    const response: ApiResponse<Cobro> = await apiRequest(
      `${ENDPOINTS.COBROS}/${id}`
    );

    return response.data!;
  },

  async create(cobroData: CobroCreate): Promise<Cobro> {
    const response: ApiResponse<Cobro> = await apiRequest(ENDPOINTS.COBROS, {
      method: 'POST',
      body: JSON.stringify(cobroData),
    });

    return response.data!;
  },

  async update(id: number, cobroData: CobroUpdate): Promise<Cobro> {
    const response: ApiResponse<Cobro> = await apiRequest(
      `${ENDPOINTS.COBROS}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(cobroData),
      }
    );

    return response.data!;
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`${ENDPOINTS.COBROS}/${id}`, {
      method: 'DELETE',
    });
  },

  // Obtener estado de pago de un estudiante
  async getEstadoPago(estudianteId: number): Promise<EstadoPagoEstudiante> {
    const response: ApiResponse<EstadoPagoEstudiante> = await apiRequest(
      `${ENDPOINTS.COBROS}/estado-pago/${estudianteId}`
    );
    return response.data!;
  },

  // Obtener resumen de pagos de todos los estudiantes
  async getResumenPagos(
    mes?: number,
    anio?: number
  ): Promise<ResumenPagoEstudiante[]> {
    const queryParams = buildQueryParams({ mes, anio });
    const response: ApiResponse<ResumenPagoEstudiante[]> = await apiRequest(
      `${ENDPOINTS.COBROS}/resumen-pagos${queryParams}`
    );
    return response.data!;
  },

  // Método específico para registrar pago mensual
  async registrarPagoMensual(
    idEstudiante: number,
    monto: number,
    metodoPago: string,
    mesCorrespondiente: string
  ): Promise<Cobro> {
    const cobroData: CobroCreate = {
      idEstudiante,
      monto,
      fechaPago: new Date().toISOString(),
      metodoPago,
      mesCorrespondiente,
      estadoCobro: 'pagado',
      tipoCobro: 'mensual',
    };
    return this.create(cobroData);
  },

  // Obtener historial de pagos de un estudiante con paginación
  async getHistorialPagos(
    estudianteId: number,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Cobro>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    });
    const response: ApiResponse<PaginatedResponse<Cobro>> = await apiRequest(
      `${ENDPOINTS.COBROS}/historial/${estudianteId}${queryParams}`
    );
    return response.data!;
  },
};
