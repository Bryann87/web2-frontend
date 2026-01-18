import { API_CONFIG } from '@/config/api';

export interface ReportFilters {
  fechaInicio?: string;
  fechaFin?: string;
  [key: string]: string | number | boolean | undefined;
}

const buildQueryString = (filters: ReportFilters): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const downloadFile = async (
  endpoint: string,
  filters: ReportFilters,
  filename: string
): Promise<void> => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
  const queryParams = buildQueryString(filters);

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${endpoint}${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al descargar el reporte');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const openPdfReport = async (
  endpoint: string,
  filters: ReportFilters
): Promise<void> => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
  const queryParams = buildQueryString(filters);

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${endpoint}${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Error al generar el reporte');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
};

export const reportUtils = {
  // Cobros
  descargarCobrosCsv: (filters: ReportFilters = {}) =>
    downloadFile(
      '/Cobros/reporte/csv',
      filters,
      `reporte_cobros_${new Date().toISOString().split('T')[0]}.csv`
    ),

  descargarCobrosPdf: (filters: ReportFilters = {}) =>
    openPdfReport('/Cobros/reporte/pdf', filters),

  // Inscripciones
  descargarInscripcionesCsv: (filters: ReportFilters = {}) =>
    downloadFile(
      '/Inscripciones/reporte/csv',
      filters,
      `reporte_inscripciones_${new Date().toISOString().split('T')[0]}.csv`
    ),

  descargarInscripcionesPdf: (filters: ReportFilters = {}) =>
    openPdfReport('/Inscripciones/reporte/pdf', filters),

  // Clases
  descargarClasesCsv: (filters: ReportFilters = {}) =>
    downloadFile(
      '/Clases/reporte/csv',
      filters,
      `reporte_clases_${new Date().toISOString().split('T')[0]}.csv`
    ),

  descargarClasesPdf: (filters: ReportFilters = {}) =>
    openPdfReport('/Clases/reporte/pdf', filters),

  // Asistencias (ya existentes, pero agregamos aquí para consistencia)
  descargarAsistenciasCsv: (filters: ReportFilters = {}) =>
    downloadFile(
      '/Asistencias/reporte/csv',
      filters,
      `reporte_asistencias_${new Date().toISOString().split('T')[0]}.csv`
    ),

  descargarAsistenciasPdf: (filters: ReportFilters = {}) =>
    openPdfReport('/Asistencias/reporte/pdf', filters),
};
