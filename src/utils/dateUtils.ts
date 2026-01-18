import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Zona horaria de Ecuador (UTC-5)
const ECUADOR_TIMEZONE = 'America/Guayaquil';

/**
 * Convierte una fecha UTC a hora de Ecuador
 * @param date - Fecha a convertir
 * @returns Fecha ajustada a Ecuador
 */
export const toEcuadorTime = (date: Date): Date => {
  return new Date(date.toLocaleString('en-US', { timeZone: ECUADOR_TIMEZONE }));
};

/**
 * Obtiene la fecha y hora actual en Ecuador
 * @returns Fecha actual en zona horaria de Ecuador
 */
export const getNowEcuador = (): Date => {
  return toEcuadorTime(new Date());
};

/**
 * Formatea una fecha de manera segura con hora de Ecuador
 * @param dateString - String de fecha en cualquier formato válido
 * @param formatString - Formato de salida (por defecto 'dd/MM/yyyy HH:mm')
 * @param locale - Locale para el formato (por defecto español)
 * @returns Fecha formateada o 'N/A' si no es válida
 */
export const formatSafeDate = (
  dateString: string | null | undefined,
  formatString: string = 'dd/MM/yyyy HH:mm',
  locale = es
): string => {
  if (!dateString) return 'N/A';

  try {
    // Intentar parsear como ISO string primero
    let date = parseISO(dateString);

    // Si no es válido, intentar con new Date
    if (!isValid(date)) {
      date = new Date(dateString);
    }

    // Si aún no es válido, retornar el string original o N/A
    if (!isValid(date)) {
      return dateString || 'N/A';
    }

    // Convertir a hora de Ecuador
    const ecuadorDate = toEcuadorTime(date);

    return format(ecuadorDate, formatString, { locale });
  } catch (error) {
    return dateString || 'N/A';
  }
};

/**
 * Formatea solo la fecha sin hora (para Ecuador)
 * @param dateString - String de fecha
 * @returns Fecha formateada dd/MM/yyyy
 */
export const formatDateOnly = (
  dateString: string | null | undefined
): string => {
  return formatSafeDate(dateString, 'dd/MM/yyyy');
};

/**
 * Formatea fecha con hora completa para Ecuador
 * @param dateString - String de fecha
 * @returns Fecha formateada dd/MM/yyyy HH:mm:ss
 */
export const formatDateTimeFull = (
  dateString: string | null | undefined
): string => {
  return formatSafeDate(dateString, 'dd/MM/yyyy HH:mm:ss');
};

/**
 * Convierte una fecha a formato ISO para inputs de tipo date (hora Ecuador)
 * @param date - Fecha a convertir
 * @returns String en formato YYYY-MM-DD
 */
export const toInputDateFormat = (date: Date = new Date()): string => {
  const ecuadorDate = toEcuadorTime(date);
  const year = ecuadorDate.getFullYear();
  const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
  const day = String(ecuadorDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha a formato ISO completo con hora actual de Ecuador
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns String en formato ISO completo con zona horaria UTC
 */
export const toISOWithCurrentTime = (dateString: string): string => {
  // Crear fecha con la fecha seleccionada y hora actual
  const [year, month, day] = dateString.split('-').map(Number);
  const now = new Date();

  // Crear fecha UTC con los componentes
  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    )
  );

  return date.toISOString();
};
