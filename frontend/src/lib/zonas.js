export const ZONA_COLOR = {
  Aventura: '#059669',
  Familiar: '#d97706',
  Fantasía: '#c026d3',
  Acuática: '#0891b2',
};

const COLOR_DEFECTO = '#4f46e5';

export function colorDeZona(zona) {
  return ZONA_COLOR[zona] || COLOR_DEFECTO;
}

export function listaZonas() {
  return Object.keys(ZONA_COLOR);
}
