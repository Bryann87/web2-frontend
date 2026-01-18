import { apiRequest, buildQueryParams } from '@/config/api';

export interface AuditLog {
  idAudit: number;
  tablaAfectada: string;
  tipoOperacion: string;
  idRegistro: string | null;
  datosAnteriores: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
  camposModificados: string[] | null;
  idUsuario: number | null;
  nombreUsuario: string | null;
  rolUsuario: string | null;
  ipAddress: string | null;
  endpoint: string | null;
  metodoHttp: string | null;
  fechaOperacion: string;
  duracionMs: number | null;
  exitoso: boolean;
  mensajeError: string | null;
}

export interface AuditLogFilter {
  tablaAfectada?: string;
  tipoOperacion?: string;
  idUsuario?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  idRegistro?: string;
  exitoso?: boolean;
  pagina?: number;
  tamañoPagina?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  pagina: number;
  tamañoPagina: number;
  totalPaginas: number;
}

export interface AuditResumen {
  totalOperaciones: number;
  totalInserts: number;
  totalUpdates: number;
  totalDeletes: number;
  operacionesFallidas: number;
  operacionesPorTabla: Record<string, number>;
  operacionesPorUsuario: Record<string, number>;
  ultimasOperaciones: AuditLog[];
}

export interface HistorialRegistro {
  tablaAfectada: string;
  idRegistro: string;
  cambios: AuditLog[];
}

export const auditService = {
  async obtenerLogs(filtro: AuditLogFilter = {}): Promise<AuditLogResponse> {
    const params = buildQueryParams({
      tablaAfectada: filtro.tablaAfectada,
      tipoOperacion: filtro.tipoOperacion,
      idUsuario: filtro.idUsuario,
      fechaDesde: filtro.fechaDesde,
      fechaHasta: filtro.fechaHasta,
      idRegistro: filtro.idRegistro,
      exitoso: filtro.exitoso,
      pagina: filtro.pagina || 1,
      tamañoPagina: filtro.tamañoPagina || 50,
    });

    const response = await apiRequest(`/Audit${params}`);
    return response.data;
  },

  async obtenerResumen(
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<AuditResumen> {
    const params = buildQueryParams({ fechaDesde, fechaHasta });
    const response = await apiRequest(`/Audit/resumen${params}`);
    return response.data;
  },

  async obtenerHistorial(
    tabla: string,
    idRegistro: string
  ): Promise<HistorialRegistro> {
    const response = await apiRequest(
      `/Audit/historial/${tabla}/${idRegistro}`
    );
    return response.data;
  },

  async obtenerPorUsuario(
    idUsuario: number,
    limite = 100
  ): Promise<AuditLog[]> {
    const response = await apiRequest(
      `/Audit/usuario/${idUsuario}?limite=${limite}`
    );
    return response.data;
  },

  async obtenerTablas(): Promise<string[]> {
    const response = await apiRequest('/Audit/tablas');
    return response.data;
  },

  async obtenerTiposOperacion(): Promise<string[]> {
    const response = await apiRequest('/Audit/tipos-operacion');
    return response.data;
  },
};
