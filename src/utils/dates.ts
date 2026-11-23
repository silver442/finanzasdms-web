/** Zona horaria de negocio de FinanzasDMS (centro de México, GMT-6). Igual que `APP_TIME_ZONE` del backend. */
export const APP_TIME_ZONE = 'America/Mexico_City';

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE });

/**
 * Fecha YYYY-MM-DD en hora de México. No usar `toISOString().slice(0, 10)`: es UTC y
 * después de las 18:00 en México ya marca el día siguiente.
 */
export const toMxIsoDate = (date: Date) => isoDateFormatter.format(date);

/** Hoy (YYYY-MM-DD) en hora de México, para valores por defecto de inputs `type="date"`. */
export const todayMx = () => toMxIsoDate(new Date());
