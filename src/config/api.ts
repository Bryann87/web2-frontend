export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5225/api',
  TOKEN_KEY: 'academia_token',
  USER_KEY: 'academia_user',
};

export const ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/Auth/login',
    REGISTER: '/Auth/register',
    GENERATE_HASH: '/Auth/generate-hash',
    DEBUG_LOGIN: '/Auth/debug-login',
  },

  // Personas
  PERSONAS: '/Personas',

  // Estudiantes
  ESTUDIANTES: '/Estudiantes',
  ESTUDIANTES_BY_CLASE: (claseId: number) => `/Estudiantes/clase/${claseId}`,

  // Profesores
  PROFESORES: '/Profesores',
  PROFESORES_BY_PERSONA: (idPersona: number) =>
    `/Profesores/persona/${idPersona}`,

  // Clases
  CLASES: '/Clases',
  CLASES_BY_PROFESOR: (profesorId: number) => `/Clases/profesor/${profesorId}`,
  CLASES_ESTUDIANTES: (claseId: number) => `/Clases/${claseId}/estudiantes`,

  // Asistencias
  ASISTENCIAS: '/Asistencias',
  ASISTENCIAS_BY_CLASE: (claseId: number, fecha?: string) =>
    `/Asistencias/clase/${claseId}${fecha ? `?fecha=${fecha}` : ''}`,
  ASISTENCIAS_BY_ESTUDIANTE: (
    estudianteId: number,
    fechaInicio?: string,
    fechaFin?: string
  ) => {
    let url = `/Asistencias/estudiante/${estudianteId}`;
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    return url + (params.toString() ? `?${params.toString()}` : '');
  },

  // Inscripciones
  INSCRIPCIONES: '/Inscripciones',
  INSCRIPCIONES_BY_CLASE: (claseId: number) =>
    `/Inscripciones/clase/${claseId}`,

  // Cobros
  COBROS: '/Cobros',

  // Estilos de Danza
  ESTILOS_DANZA: '/EstilosDanza',

  // Representantes
  REPRESENTANTES: '/Representantes',
  REPRESENTANTES_BY_ESTUDIANTE: (idEstudiante: number) =>
    `/Representantes/estudiante/${idEstudiante}`,
  REPRESENTANTES_MIS_ESTUDIANTES: (correo: string) =>
    `/Representantes/mis-estudiantes?correo=${encodeURIComponent(correo)}`,

  // Estados
  ESTADOS: '/Estados',
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.USER_KEY);
    window.location.href = '/login';
    throw new Error('Sesión expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    // Proporcionar mensaje más descriptivo según el código de estado
    if (response.status === 403) {
      throw new Error(
        data.message || 'No tienes permisos para realizar esta acción'
      );
    }
    if (response.status === 404) {
      throw new Error(data.message || 'Recurso no encontrado');
    }
    if (response.status === 500) {
      throw new Error(data.message || 'Error interno del servidor');
    }
    throw new Error(
      data.message || `Error en la petición (${response.status})`
    );
  }

  return data;
};

// Función para construir query parameters
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};
