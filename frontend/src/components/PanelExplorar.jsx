import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { Seccion, CargandoLinea, ErrorBanner, EstadoVacio, BadgeZona, claseInput } from './ui/common';
import { IconSearch, IconTrophy, IconClock, IconUsers } from './ui/Icons';

function FilaAtraccion({ atraccion, posicion, onSeleccionar }) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(atraccion)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-(--color-surface-muted)"
    >
      {posicion !== undefined && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/10 text-xs font-bold text-(--color-primary)">
          {posicion}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-(--color-foreground)">{atraccion.nombre}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <BadgeZona zona={atraccion.zona} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-(--color-muted-foreground)">
        <span className="inline-flex items-center gap-1">
          <IconUsers size={12} /> {atraccion.popularidad}
        </span>
        <span className="inline-flex items-center gap-1">
          <IconClock size={12} /> {atraccion.tiempoEsperaFila}′
        </span>
      </div>
    </button>
  );
}

export default function PanelExplorar({ refreshKey, onSeleccionarAtraccion }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const [top, setTop] = useState(5);
  const [ranking, setRanking] = useState([]);
  const [cargandoRanking, setCargandoRanking] = useState(true);
  const [errorRanking, setErrorRanking] = useState('');

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResultados([]);
      setErrorBusqueda('');
      return;
    }
    setBuscando(true);
    setErrorBusqueda('');
    const timeout = setTimeout(async () => {
      try {
        const datos = await api.buscarAtracciones(q);
        setResultados(datos);
      } catch (err) {
        setErrorBusqueda(err instanceof ApiError ? err.message : 'Error al buscar');
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const cargarRanking = async () => {
    setCargandoRanking(true);
    setErrorRanking('');
    try {
      const datos = await api.ranking(top);
      setRanking(datos);
    } catch (err) {
      setErrorRanking(err instanceof ApiError ? err.message : 'Error al cargar el ranking');
    } finally {
      setCargandoRanking(false);
    }
  };

  useEffect(() => {
    cargarRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top, refreshKey]);

  return (
    <div className="flex flex-col gap-4">
      <Seccion titulo="Buscar atracción" icono={<IconSearch size={16} />}>
        <div className="relative">
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted-foreground)" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. Cóndor, Rueda, Río…"
            className={`${claseInput} pl-9`}
            aria-label="Buscar atracción por nombre"
          />
        </div>

        <div className="mt-2">
          {buscando && <CargandoLinea texto="Buscando…" />}
          {!buscando && errorBusqueda && <ErrorBanner mensaje={errorBusqueda} />}
          {!buscando && !errorBusqueda && query.trim() && resultados.length === 0 && (
            <EstadoVacio titulo="Sin resultados" descripcion={`Ninguna atracción coincide con "${query}"`} />
          )}
          {!buscando && resultados.length > 0 && (
            <div className="flex flex-col divide-y divide-(--color-border)">
              {resultados.map((a) => (
                <FilaAtraccion key={a.id} atraccion={a} onSeleccionar={onSeleccionarAtraccion} />
              ))}
            </div>
          )}
        </div>
      </Seccion>

      <Seccion
        titulo="Ranking de popularidad"
        icono={<IconTrophy size={16} />}
        accion={
          <select
            value={top}
            onChange={(e) => setTop(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-(--color-border) bg-(--color-surface) px-2 py-1 text-xs font-semibold outline-none"
            aria-label="Cantidad de atracciones en el ranking"
          >
            {[3, 5, 10, 15].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        }
      >
        {cargandoRanking && <CargandoLinea />}
        {!cargandoRanking && errorRanking && <ErrorBanner mensaje={errorRanking} onReintentar={cargarRanking} />}
        {!cargandoRanking && !errorRanking && ranking.length === 0 && (
          <EstadoVacio titulo="Aún no hay atracciones" descripcion="Carga el seed del backend para ver el ranking." />
        )}
        {!cargandoRanking && ranking.length > 0 && (
          <div className="flex flex-col divide-y divide-(--color-border)">
            {ranking.map((a, i) => (
              <FilaAtraccion key={a.id} atraccion={a} posicion={i + 1} onSeleccionar={onSeleccionarAtraccion} />
            ))}
          </div>
        )}
      </Seccion>
    </div>
  );
}
