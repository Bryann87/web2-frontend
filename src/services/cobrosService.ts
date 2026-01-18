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
  fechaInicio?: string;
  fechaFin?: string;
}

export const cobrosService = {
  // Helper to normalize cobro object (handle PascalCase from API)
  normalizeCobro(cobro: Record<string, unknown>): Cobro {
    const estudianteData = (cobro.estudiante ?? cobro.Estudiante) as
      | Record<string, unknown>
      | undefined;
    return {
      idCobro: (cobro.idCobro ?? cobro.IdCobro) as number,
      monto: (cobro.monto ?? cobro.Monto) as number,
      fechaPago: (cobro.fechaPago ?? cobro.FechaPago) as string | undefined,
      fechaVencimiento: (cobro.fechaVencimiento ?? cobro.FechaVencimiento) as
        | string
        | undefined,
      metodoPago: (cobro.metodoPago ?? cobro.MetodoPago) as string | undefined,
      mesCorrespondiente: (cobro.mesCorrespondiente ??
        cobro.MesCorrespondiente) as string | undefined,
      estadoCobro: (cobro.estadoCobro ?? cobro.EstadoCobro) as
        | string
        | undefined,
      observaciones: (cobro.observaciones ?? cobro.Observaciones) as
        | string
        | undefined,
      tipoCobro: (cobro.tipoCobro ?? cobro.TipoCobro) as string,
      anioCorrespondiente: (cobro.anioCorrespondiente ??
        cobro.AnioCorrespondiente) as number | undefined,
      estudiante: estudianteData
        ? {
            idPersona: (estudianteData.idPersona ??
              estudianteData.IdPersona) as number,
            nombre: (estudianteData.nombre ?? estudianteData.Nombre) as string,
            apellido: (estudianteData.apellido ??
              estudianteData.Apellido) as string,
            nombreCompleto: (estudianteData.nombreCompleto ??
              estudianteData.NombreCompleto) as string,
            rol: (estudianteData.rol ??
              estudianteData.Rol ??
              'estudiante') as string,
          }
        : undefined,
    };
  },

  async getAll(
    params: PaginationParams = {},
    filters: CobroFilters = {},
  ): Promise<PaginatedResponse<Cobro>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ...filters,
    });

    const response: ApiResponse<PaginatedResponse<Cobro>> = await apiRequest(
      `${ENDPOINTS.COBROS}${queryParams}`,
    );

    // Normalize cobros to handle PascalCase from API
    const normalizedData = (
      response.data!.data as unknown as Record<string, unknown>[]
    ).map((c) => this.normalizeCobro(c));

    return {
      ...response.data!,
      data: normalizedData,
    };
  },

  async getById(id: number): Promise<Cobro> {
    const response: ApiResponse<Cobro> = await apiRequest(
      `${ENDPOINTS.COBROS}/${id}`,
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
      },
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
      `${ENDPOINTS.COBROS}/estado-pago/${estudianteId}`,
    );
    return response.data!;
  },

  // Obtener resumen de pagos de todos los estudiantes
  async getResumenPagos(
    mes?: number,
    anio?: number,
  ): Promise<ResumenPagoEstudiante[]> {
    const queryParams = buildQueryParams({ mes, anio });
    const response: ApiResponse<ResumenPagoEstudiante[]> = await apiRequest(
      `${ENDPOINTS.COBROS}/resumen-pagos${queryParams}`,
    );
    return response.data!;
  },

  // Método específico para registrar pago mensual
  async registrarPagoMensual(
    idEstudiante: number,
    monto: number,
    metodoPago: string,
    mesCorrespondiente: string,
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
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Cobro>> {
    const queryParams = buildQueryParams({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    });
    const response: ApiResponse<PaginatedResponse<Cobro>> = await apiRequest(
      `${ENDPOINTS.COBROS}/historial/${estudianteId}${queryParams}`,
    );

    // Normalize cobros to handle PascalCase from API
    const normalizedData = (
      response.data!.data as unknown as Record<string, unknown>[]
    ).map((c) => this.normalizeCobro(c));

    return {
      ...response.data!,
      data: normalizedData,
    };
  },
};
