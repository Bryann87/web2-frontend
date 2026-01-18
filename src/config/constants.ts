// Configuración de constantes para evitar datos hardcodeados

export const PAYMENT_METHODS = ['Efectivo', 'Transferencia'] as const;

// Labels para mostrar en la UI
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia',
};

export const PERSON_TYPES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'profesor', label: 'Profesor' },
  { value: 'estudiante', label: 'Estudiante' },
] as const;

export const INSCRIPTION_STATES = [
  'activa',
  'inactiva',
  'suspendida',
  'cancelada',
] as const;

export const PAYMENT_STATES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'cancelado', label: 'Cancelado' },
] as const;

export const ATTENDANCE_STATES = [
  'presente',
  'ausente',
  'tarde',
  'justificado',
] as const;

export const DIFFICULTY_LEVELS = [
  'Principiante',
  'Intermedio',
  'Avanzado',
] as const;

export const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
] as const;

export const RELATIONSHIP_TYPES = [
  'Padre',
  'Madre',
  'Tutor',
  'Abuelo',
  'Abuela',
  'Tío',
  'Tía',
  'Hermano',
  'Hermana',
  'Otro',
] as const;

// Configuración de paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_PAGE_SIZE: 100,
} as const;

// Configuración de validación
export const VALIDATION_CONFIG = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 100,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MIN_PHONE_LENGTH: 8,
  MAX_PHONE_LENGTH: 15,
  MIN_AGE: 3,
  MAX_AGE: 100,
  MIN_CLASS_DURATION: 30,
  MAX_CLASS_DURATION: 180,
  MIN_CLASS_CAPACITY: 1,
  MAX_CLASS_CAPACITY: 50,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
} as const;

// Configuración de fechas
export const DATE_CONFIG = {
  DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',
  DISPLAY_DATE_FORMAT: 'DD/MM/YYYY',
  DISPLAY_DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
} as const;
