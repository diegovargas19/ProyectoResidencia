import moment from 'moment-timezone';

const ZONA_HORARIA = 'America/Mexico_City';

export const fechaYaPaso = (fecha) => {
  if (!fecha) return false;

  const hoy = moment.tz(ZONA_HORARIA).startOf('day');
  const fechaLimite = moment.tz(fecha, 'YYYY-MM-DD', ZONA_HORARIA).startOf('day');

  return hoy.isAfter(fechaLimite);
};

export const fechaNoHaIniciado = (fecha) => {
  if (!fecha) return false;

  const hoy = moment.tz(ZONA_HORARIA).startOf('day');
  const fechaInicio = moment.tz(fecha, 'YYYY-MM-DD', ZONA_HORARIA).startOf('day');

  return hoy.isBefore(fechaInicio);
};
