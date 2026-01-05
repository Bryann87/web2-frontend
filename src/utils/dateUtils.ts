import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha de manera segura, manejando diferentes formatos de entrada
 * @param dateString - String de fecha en cualquier formato válido
 * @param formatString - Formato de salida (por defecto 'dd/MM/yyyy')
 * @param locale - Locale para el formato (por defecto español)
 * @returns Fecha formateada o 'N/A' si no es válida
 */
export const formatSafeDate = (
  dateString: string | null | undefined,
  formatString: string = 'dd/MM/yyyy',
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

    return format(date, formatString, { locale });
  } catch (error) {
    return dateString || 'N/A';
  }
};

/**
 * Convierte una fecha a formato ISO para inputs de tipo date
 * @param date - Fecha a convertir
 * @returns String en formato YYYY-MM-DD
 */
export const toInputDateFormat = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Convierte una fecha a formato ISO completo con hora actual
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns String en formato ISO completo
 */
export const toISOWithCurrentTime = (dateString: string): string => {
  const currentTime = new Date().toTimeString().split(' ')[0];
  return `${dateString}T${currentTime}`;
};
