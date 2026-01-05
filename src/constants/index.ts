// Constantes de configuración para evitar datos hardcodeados

export const APP_CONFIG = {
  // Configuración de paginación
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Configuración de validación
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 100,

  // Configuración de tabla
  DEFAULT_TABLE_SIZE: 'sm' as const,
  TABLE_VARIANTS: {
    default: 'bg-white',
    striped: 'even:bg-gray-50',
    bordered: 'border border-gray-200',
  },

  // Estados de asistencia
  ATTENDANCE_STATES: {
    PRESENTE: 'presente',
    AUSENTE: 'ausente',
    TARDE: 'tarde',
  } as const,

  // Estados de cobro
  PAYMENT_STATES: {
    PAGADO: 'pagado',
    PENDIENTE: 'pendiente',
    VENCIDO: 'vencido',
  } as const,

  // Tipos de persona
  PERSON_TYPES: {
    ADMIN: 'administrador',
    TEACHER: 'profesor',
    STUDENT: 'estudiante',
  } as const,

  // Métodos de pago
  PAYMENT_METHODS: {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    CARD: 'Tarjeta',
  } as const,

  // Días de la semana
  WEEKDAYS: {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  } as const,

  // Niveles de dificultad
  DIFFICULTY_LEVELS: {
    BEGINNER: 'Principiante',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
  } as const,
};

// Opciones para formularios
export const FORM_OPTIONS = {
  personTypes: [
    { value: APP_CONFIG.PERSON_TYPES.ADMIN, label: 'Administrador' },
    { value: APP_CONFIG.PERSON_TYPES.TEACHER, label: 'Profesor' },
    { value: APP_CONFIG.PERSON_TYPES.STUDENT, label: 'Estudiante' },
  ],

  paymentMethods: [
    { value: 'efectivo', label: APP_CONFIG.PAYMENT_METHODS.CASH },
    { value: 'transferencia', label: APP_CONFIG.PAYMENT_METHODS.TRANSFER },
    { value: 'tarjeta', label: APP_CONFIG.PAYMENT_METHODS.CARD },
  ],

  weekdays: [
    { value: 'lunes', label: APP_CONFIG.WEEKDAYS.MONDAY },
    { value: 'martes', label: APP_CONFIG.WEEKDAYS.TUESDAY },
    { value: 'miercoles', label: APP_CONFIG.WEEKDAYS.WEDNESDAY },
    { value: 'jueves', label: APP_CONFIG.WEEKDAYS.THURSDAY },
    { value: 'viernes', label: APP_CONFIG.WEEKDAYS.FRIDAY },
    { value: 'sabado', label: APP_CONFIG.WEEKDAYS.SATURDAY },
    { value: 'domingo', label: APP_CONFIG.WEEKDAYS.SUNDAY },
  ],

  difficultyLevels: [
    { value: 'principiante', label: APP_CONFIG.DIFFICULTY_LEVELS.BEGINNER },
    { value: 'intermedio', label: APP_CONFIG.DIFFICULTY_LEVELS.INTERMEDIATE },
    { value: 'avanzado', label: APP_CONFIG.DIFFICULTY_LEVELS.ADVANCED },
  ],

  attendanceStates: [
    { value: APP_CONFIG.ATTENDANCE_STATES.PRESENTE, label: 'Presente' },
    { value: APP_CONFIG.ATTENDANCE_STATES.AUSENTE, label: 'Ausente' },
    { value: APP_CONFIG.ATTENDANCE_STATES.TARDE, label: 'Tarde' },
  ],

  paymentStates: [
    { value: APP_CONFIG.PAYMENT_STATES.PAGADO, label: 'Pagado' },
    { value: APP_CONFIG.PAYMENT_STATES.PENDIENTE, label: 'Pendiente' },
    { value: APP_CONFIG.PAYMENT_STATES.VENCIDO, label: 'Vencido' },
  ],
};

// Configuración de colores para estados
export const STATE_COLORS = {
  attendance: {
    [APP_CONFIG.ATTENDANCE_STATES.PRESENTE]: 'bg-green-100 text-green-800',
    [APP_CONFIG.ATTENDANCE_STATES.AUSENTE]: 'bg-red-100 text-red-800',
    [APP_CONFIG.ATTENDANCE_STATES.TARDE]: 'bg-yellow-100 text-yellow-800',
  },

  payment: {
    [APP_CONFIG.PAYMENT_STATES.PAGADO]: 'bg-green-100 text-green-800',
    [APP_CONFIG.PAYMENT_STATES.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
    [APP_CONFIG.PAYMENT_STATES.VENCIDO]: 'bg-red-100 text-red-800',
  },

  personType: {
    [APP_CONFIG.PERSON_TYPES.ADMIN]: 'bg-red-100 text-red-800',
    [APP_CONFIG.PERSON_TYPES.TEACHER]: 'bg-purple-100 text-purple-800',
    [APP_CONFIG.PERSON_TYPES.STUDENT]: 'bg-blue-100 text-blue-800',
  },
};

// Expresiones regulares para validación
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\-\+\(\)\s]+$/,
  TIME: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
};

// Mensajes de error estándar
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_TIME: 'Formato de hora inválido (HH:MM)',
  INVALID_DECIMAL: 'Debe ser un número decimal válido',
  MIN_LENGTH: (min: number) => `Debe tener al menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `No puede exceder ${max} caracteres`,
  MIN_VALUE: (min: number) => `El valor mínimo es ${min}`,
  MAX_VALUE: (max: number) => `El valor máximo es ${max}`,
};
