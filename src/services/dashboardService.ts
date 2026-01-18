import { apiRequest, ENDPOINTS } from '@/config/api';

export interface EstadisticasClases {
  totalClases: number;
  clasesActivas: number;
  totalEstudiantes: number;
  capacidadTotal: number;
  cuposDisponibles: number;
  porcentajeOcupacion: number;
  clasesPorEstilo: {
    idEstilo: number;
    cantidadClases: number;
    estudiantesInscritos: number;
  }[];
}

export interface EstadisticasDashboard {
  clases: EstadisticasClases;
  // Aquí se pueden agregar más estadísticas en el futuro
}

export const dashboardService = {
  async getEstadisticasClases(): Promise<EstadisticasClases> {
    const response = await apiRequest('/clases/estadisticas');
    return response.data;
  },

  async getEstadisticasDashboard(): Promise<EstadisticasDashboard> {
    const [estadisticasClases] = await Promise.all([
      this.getEstadisticasClases(),
    ]);

    return {
      clases: estadisticasClases,
    };
  },
};
