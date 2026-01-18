// Tipos base
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Tipos de usuario
export type UserRole =
  | 'administrador'
  | 'profesor'
  | 'estudiante'
  | 'representante';

export interface User {
  token: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  esProfesor?: boolean;
  esAdmin?: boolean;
  idPersona: number;
}

// Entidad principal: Persona (unificada) - coincide con PersonaDto del backend
export interface Persona {
  idPersona: number;
  nombre: string;
  apellido: string;
  telefono?: string;
  correo?: string;
  rol: UserRole;
  fechaNacimiento?: string;
  genero?: string;
  direccion?: string;
  cedula?: string;
  condicionesMedicas?: string;
  // Campos de profesor
  especialidad?: string;
  fechaContrato?: string;
  salarioBase?: number;
  // Campos de representante
  parentesco?: string;
  idEstudianteRepresentado?: number;
  nombreEstudianteRepresentado?: string;
  activo: boolean;
  nombreCompleto: string;
}

// Alias para compatibilidad con páginas existentes
export type Estudiante = Persona;
export type Profesor = Persona;

export interface PersonaSimple {
  idPersona: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  rol: string;
}

export interface PersonaCreate {
  nombre: string;
  apellido: string;
  telefono?: string;
  correo?: string;
  rol: UserRole;
  contrasena?: string;
  fechaNacimiento?: string;
  genero?: string;
  direccion?: string;
  cedula?: string;
  condicionesMedicas?: string;
  // Campos de profesor
  especialidad?: string;
  fechaContrato?: string;
  salarioBase?: number;
  // Campos de representante
  parentesco?: string;
  idEstudianteRepresentado?: number;
}

export interface PersonaUpdate {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
  rol?: UserRole;
  fechaNacimiento?: string;
  genero?: string;
  direccion?: string;
  cedula?: string;
  condicionesMedicas?: string;
  especialidad?: string;
  fechaContrato?: string;
  salarioBase?: number;
  parentesco?: string;
  idEstudianteRepresentado?: number;
  activo?: boolean;
}

// Estilos de Danza
export interface EstiloDanza {
  idEstilo: number;
  nombreEsti: string;
  descripcion?: string;
  nivelDificultad: string;
  edadMinima?: number;
  edadMaxima?: number;
  activo: boolean;
  precioBase?: number;
}

export interface EstiloDanzaCreate {
  nombreEsti: string;
  descripcion?: string;
  nivelDificultad?: string;
  edadMinima?: number;
  edadMaxima?: number;
  activo?: boolean;
  precioBase?: number;
}

export interface EstiloDanzaUpdate {
  nombreEsti: string;
  descripcion?: string;
  nivelDificultad: string;
  edadMinima?: number;
  edadMaxima?: number;
  activo: boolean;
  precioBase?: number;
}

// Clases
export interface Clase {
  idClase: number;
  nombreClase?: string;
  diaSemana?: string;
  hora: string;
  duracionMinutos: number;
  capacidadMax: number;
  precioMensuClas: number;
  activa: boolean;
  profesor?: PersonaSimple;
  estiloDanza?: EstiloDanza;
  estudiantesInscritos?: number;
  cuposDisponibles?: number;
  tieneCuposDisponibles?: boolean;
}

export interface ClaseSimple {
  idClase: number;
  nombreClase?: string;
  diaSemana?: string;
  hora: string;
}

export interface ClaseCreate {
  nombreClase: string;
  diaSemana: string;
  hora: string;
  duracionMinutos: number;
  capacidadMax: number;
  precioMensuClas: number;
  idProfesor: number;
  idEstilo: number;
}

export interface ClaseUpdate {
  nombreClase: string;
  diaSemana: string;
  hora: string;
  duracionMinutos: number;
  capacidadMax: number;
  precioMensuClas: number;
  idProfesor: number;
  idEstilo: number;
  activa: boolean;
}

// Asistencias
export interface Asistencia {
  idAsist: number;
  fechaAsis: string;
  estadoAsis?: string;
  observaciones?: string;
  estudiante?: PersonaSimple;
  clase?: ClaseSimple;
}

export interface AsistenciaCreate {
  fechaAsis: string;
  estadoAsis?: string;
  observaciones?: string;
  idEstudiante: number;
  idClase: number;
}

export interface AsistenciaUpdate {
  fechaAsis: string;
  estadoAsis: string;
  observaciones?: string;
  idEstudiante: number;
  idClase: number;
}

// Inscripciones
export interface Inscripcion {
  idInsc: number;
  fechaInsc: string;
  estado?: string;
  fechaBaja?: string;
  motivoBaja?: string;
  estudiante?: PersonaSimple;
  clase?: ClaseSimple;
}

export interface InscripcionCreate {
  fechaInsc?: string;
  estado?: string;
  idEstudiante: number;
  idClase: number;
}

export interface InscripcionUpdate {
  fechaInsc?: string;
  estado?: string;
  fechaBaja?: string;
  motivoBaja?: string;
}

// Cobros
export interface Cobro {
  idCobro: number;
  monto: number;
  fechaPago?: string;
  fechaVencimiento?: string;
  metodoPago?: string;
  mesCorrespondiente?: string;
  estadoCobro?: string;
  observaciones?: string;
  tipoCobro: string;
  anioCorrespondiente?: number;
  estudiante?: PersonaSimple;
}

export interface CobroCreate {
  monto: number;
  fechaPago?: string;
  fechaVencimiento?: string;
  metodoPago?: string;
  mesCorrespondiente: string;
  estadoCobro?: string;
  observaciones?: string;
  tipoCobro: string;
  anioCorrespondiente?: number;
  idEstudiante: number;
}

export interface CobroUpdate {
  monto: number;
  fechaPago?: string;
  fechaVencimiento?: string;
  metodoPago?: string;
  mesCorrespondiente?: string;
  estadoCobro?: string;
  observaciones?: string;
  tipoCobro?: string;
  anioCorrespondiente?: number;
}

// Estado de pago de estudiante
export interface PagoMensual {
  mes: string;
  anio: number;
  pagado: boolean;
  fechaPago?: string;
  monto?: number;
}

export interface EstadoPagoEstudiante {
  idEstudiante: number;
  nombreCompleto: string;
  pagosMensuales: PagoMensual[];
}

export interface ResumenPagoEstudiante {
  idEstudiante: number;
  nombreCompleto: string;
  pagoMes: boolean;
  tipoPago: string;
}

// Login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  correo: string;
  contraseña: string;
  telefono?: string;
  rol?: UserRole;
}

// Estados
export interface Estado {
  idEstado: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  noAsisto: boolean;
  retirado: boolean;
  activo: boolean;
  persona?: PersonaSimple;
}

export interface EstadoCreate {
  noAsisto?: boolean;
  retirado?: boolean;
  activo?: boolean;
  idPersona?: number;
}

export interface EstadoUpdate {
  noAsisto?: boolean;
  retirado?: boolean;
  activo?: boolean;
}
