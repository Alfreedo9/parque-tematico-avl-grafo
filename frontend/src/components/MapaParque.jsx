import { useMemo } from 'react';
import { colorDeZona, listaZonas } from '../lib/zonas';

const VIEW_W = 860;
const VIEW_H = 640;

function construirParesRuta(rutaIds) {
  if (!rutaIds || rutaIds.length < 2) return new Set();
  const pares = new Set();
  for (let i = 0; i < rutaIds.length - 1; i++) {
    const [a, b] = [rutaIds[i], rutaIds[i + 1]].sort();
    pares.add(`${a}|${b}`);
  }
  return pares;
}

export default function MapaParque({
  atracciones,
  caminos,
  rutaResaltada,
  nodosCercanos,
  nodoSeleccionadoId,
  onSeleccionarNodo,
}) {
  const porId = useMemo(() => new Map(atracciones.map((a) => [a.id, a])), [atracciones]);
  const paresEnRuta = useMemo(() => construirParesRuta(rutaResaltada), [rutaResaltada]);
  const enRutaSet = useMemo(() => new Set(rutaResaltada || []), [rutaResaltada]);
  const distanciaPorId = useMemo(() => {
    const mapa = new Map();
    (nodosCercanos || []).forEach((n) => mapa.set(n.id, n.distancia));
    return mapa;
  }, [nodosCercanos]);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full rounded-xl border border-(--color-border) bg-gradient-to-br from-slate-50 to-indigo-50/60"
        role="img"
        aria-label="Mapa del parque con atracciones y caminos"
      >
        <defs>
          <marker id="flechaRuta" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <circle cx="4" cy="4" r="3" fill="var(--color-accent)" />
          </marker>
        </defs>

        {/* Aristas base */}
        {caminos.map((c, idx) => {
          const o = porId.get(c.origen?.id) || c.origen;
          const d = porId.get(c.destino?.id) || c.destino;
          if (!o || !d) return null;
          const clave = [o.id, d.id].sort().join('|');
          const activa = paresEnRuta.has(clave);
          return (
            <g key={`${o.id}-${d.id}-${idx}`}>
              <line
                x1={o.coordenadas.x}
                y1={o.coordenadas.y}
                x2={d.coordenadas.x}
                y2={d.coordenadas.y}
                stroke={activa ? 'var(--color-accent)' : '#cbd5e1'}
                strokeWidth={activa ? 4 : 2}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              {!activa && (
                <text
                  x={(o.coordenadas.x + d.coordenadas.x) / 2}
                  y={(o.coordenadas.y + d.coordenadas.y) / 2 - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  className="select-none"
                >
                  {c.tiempoCaminata}′
                </text>
              )}
            </g>
          );
        })}

        {/* Nodos */}
        {atracciones.map((a) => {
          const { x, y } = a.coordenadas;
          const color = colorDeZona(a.zona);
          const enRuta = enRutaSet.has(a.id);
          const esOrigenODestino =
            rutaResaltada && (a.id === rutaResaltada[0] || a.id === rutaResaltada[rutaResaltada.length - 1]);
          const seleccionado = nodoSeleccionadoId === a.id;
          const distanciaCercana = distanciaPorId.get(a.id);
          const radio = esOrigenODestino ? 16 : 12;

          return (
            <g
              key={a.id}
              onClick={() => onSeleccionarNodo?.(a)}
              className="cursor-pointer outline-none"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              tabIndex={0}
              role="button"
              aria-label={`${a.nombre}, zona ${a.zona}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSeleccionarNodo?.(a);
              }}
            >
              {distanciaCercana !== undefined && (
                <circle cx={x} cy={y} r={radio + 8} fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3" />
              )}
              {seleccionado && (
                <circle cx={x} cy={y} r={radio + 5} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
              )}
              <circle
                cx={x}
                cy={y}
                r={radio}
                fill={color}
                stroke={enRuta ? 'var(--color-accent)' : '#ffffff'}
                strokeWidth={enRuta ? 3.5 : 2.5}
                className="transition-all duration-200 hover:brightness-110"
              />
              <text
                x={x}
                y={y + radio + 13}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight={enRuta ? '700' : '600'}
                fill={enRuta ? 'var(--color-accent)' : '#334155'}
                className="pointer-events-none select-none"
              >
                {a.nombre.length > 20 ? `${a.nombre.slice(0, 18)}…` : a.nombre}
              </text>
              {distanciaCercana !== undefined && (
                <text x={x} y={y - radio - 8} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={color} className="select-none">
                  {distanciaCercana}′
                </text>
              )}
              <title>
                {a.nombre} · {a.zona} · Popularidad {a.popularidad} · Espera {a.tiempoEsperaFila} min
              </title>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-(--color-muted-foreground)">
        {listaZonas().map((zona) => (
          <span key={zona} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorDeZona(zona) }} />
            {zona}
          </span>
        ))}
        {rutaResaltada && rutaResaltada.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 font-semibold text-(--color-accent)">
            <span className="h-0.5 w-5 rounded-full bg-(--color-accent)" />
            Ruta calculada
          </span>
        )}
      </div>
    </div>
  );
}
