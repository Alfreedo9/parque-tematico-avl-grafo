import { useState } from 'react';
import { api, ApiError } from '../api/client';
import { Seccion, Boton, Campo, claseInput, ErrorBanner, EstadoVacio, BadgeZona } from './ui/common';
import { IconRoute, IconCompass, IconList, IconClock } from './ui/Icons';

const SUBTABS = [
  { id: 'ruta', label: 'Ruta', icono: IconRoute },
  { id: 'cercanas', label: 'Cercanas', icono: IconCompass },
  { id: 'plan', label: 'Multi-parada', icono: IconList },
];

function SelectorAtraccion({ atracciones, value, onChange, etiqueta, excluir }) {
  return (
    <Campo etiqueta={etiqueta} requerido>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${claseInput} cursor-pointer`} required>
        <option value="">Selecciona una atracción…</option>
        {atracciones
          .filter((a) => a.id !== excluir)
          .map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre} · {a.zona}
            </option>
          ))}
      </select>
    </Campo>
  );
}

function flattenTramos(tramos) {
  const ids = [];
  tramos.forEach((t, idx) => {
    const pasos = t.pasos.map((p) => p.id);
    ids.push(...(idx === 0 ? pasos : pasos.slice(1)));
  });
  return ids;
}

export default function PanelRutas({ atracciones, onResultadoRuta, onResultadoCercanas }) {
  const [sub, setSub] = useState('ruta');

  // --- Ruta corta / óptima ---
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [tipoRuta, setTipoRuta] = useState('optima');
  const [resultadoRuta, setResultadoRuta] = useState(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState('');

  const calcularRuta = async (e) => {
    e.preventDefault();
    if (!origen || !destino) return;
    setCargandoRuta(true);
    setErrorRuta('');
    setResultadoRuta(null);
    onResultadoCercanas(null);
    try {
      const datos = tipoRuta === 'optima' ? await api.rutaOptima(origen, destino) : await api.rutaCorta(origen, destino);
      setResultadoRuta(datos);
      onResultadoRuta(datos.pasos.map((p) => p.id));
    } catch (err) {
      setErrorRuta(err instanceof ApiError ? err.message : 'No se pudo calcular la ruta');
      onResultadoRuta(null);
    } finally {
      setCargandoRuta(false);
    }
  };

  // --- Cercanas ---
  const [origenCercanas, setOrigenCercanas] = useState('');
  const [limite, setLimite] = useState(10);
  const [resultadoCercanas, setResultadoCercanas] = useState(null);
  const [cargandoCercanas, setCargandoCercanas] = useState(false);
  const [errorCercanas, setErrorCercanas] = useState('');

  const buscarCercanas = async (e) => {
    e.preventDefault();
    if (!origenCercanas) return;
    setCargandoCercanas(true);
    setErrorCercanas('');
    onResultadoRuta(null);
    try {
      const datos = await api.cercanas(origenCercanas, limite);
      setResultadoCercanas(datos);
      onResultadoCercanas(datos);
    } catch (err) {
      setErrorCercanas(err instanceof ApiError ? err.message : 'No se pudo calcular la cercanía');
      onResultadoCercanas(null);
    } finally {
      setCargandoCercanas(false);
    }
  };

  // --- Planificador multi-parada ---
  const [origenPlan, setOrigenPlan] = useState('');
  const [paradas, setParadas] = useState(new Set());
  const [resultadoPlan, setResultadoPlan] = useState(null);
  const [cargandoPlan, setCargandoPlan] = useState(false);
  const [errorPlan, setErrorPlan] = useState('');

  const alternarParada = (id) => {
    setParadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const planificar = async (e) => {
    e.preventDefault();
    if (!origenPlan || paradas.size === 0) return;
    setCargandoPlan(true);
    setErrorPlan('');
    onResultadoCercanas(null);
    try {
      const datos = await api.planificar(origenPlan, [...paradas]);
      setResultadoPlan(datos);
      if (datos.tramos.length > 0) onResultadoRuta(flattenTramos(datos.tramos));
    } catch (err) {
      setErrorPlan(err instanceof ApiError ? err.message : 'No se pudo planificar el recorrido');
      onResultadoRuta(null);
    } finally {
      setCargandoPlan(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-xl border border-(--color-border) bg-(--color-surface-muted) p-1">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSub(t.id)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
              sub === t.id ? 'bg-(--color-surface) text-(--color-primary) shadow-sm' : 'text-(--color-muted-foreground) hover:text-(--color-foreground)'
            }`}
          >
            <t.icono size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'ruta' && (
        <Seccion titulo="Calcular ruta" icono={<IconRoute size={16} />}>
          <form onSubmit={calcularRuta} className="flex flex-col gap-3">
            <SelectorAtraccion atracciones={atracciones} value={origen} onChange={setOrigen} etiqueta="Origen" excluir={destino} />
            <SelectorAtraccion atracciones={atracciones} value={destino} onChange={setDestino} etiqueta="Destino" excluir={origen} />

            <Campo etiqueta="Criterio">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipoRuta('optima')}
                  className={`flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                    tipoRuta === 'optima'
                      ? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)'
                      : 'border-(--color-border) text-(--color-muted-foreground)'
                  }`}
                >
                  Óptima (camina + espera)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoRuta('corta')}
                  className={`flex-1 cursor-pointer rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                    tipoRuta === 'corta'
                      ? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)'
                      : 'border-(--color-border) text-(--color-muted-foreground)'
                  }`}
                >
                  Más corta (solo caminata)
                </button>
              </div>
            </Campo>

            <Boton type="submit" disabled={cargandoRuta || !origen || !destino}>
              {cargandoRuta ? 'Calculando…' : 'Calcular ruta'}
            </Boton>
          </form>

          {errorRuta && (
            <div className="mt-3">
              <ErrorBanner mensaje={errorRuta} />
            </div>
          )}

          {resultadoRuta && (
            <div className="mt-4 border-t border-(--color-border) pt-3">
              <p className="mb-2 text-sm font-semibold text-(--color-foreground)">
                Tiempo total: <span className="text-(--color-accent)">{resultadoRuta.distanciaTotal} min</span>
              </p>
              <ol className="flex flex-col gap-1.5">
                {resultadoRuta.pasos.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/10 text-[10px] font-bold text-(--color-primary)">
                      {i + 1}
                    </span>
                    <span className="font-medium">{p.nombre}</span>
                    <BadgeZona zona={p.zona} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Seccion>
      )}

      {sub === 'cercanas' && (
        <Seccion titulo="Atracciones cercanas" icono={<IconCompass size={16} />}>
          <form onSubmit={buscarCercanas} className="flex flex-col gap-3">
            <SelectorAtraccion atracciones={atracciones} value={origenCercanas} onChange={setOrigenCercanas} etiqueta="Desde" />
            <Campo etiqueta="Límite de caminata (minutos)" requerido>
              <input
                type="number"
                min="1"
                value={limite}
                onChange={(e) => setLimite(Number(e.target.value))}
                className={claseInput}
                required
              />
            </Campo>
            <Boton type="submit" disabled={cargandoCercanas || !origenCercanas}>
              {cargandoCercanas ? 'Buscando…' : 'Buscar cercanas'}
            </Boton>
          </form>

          {errorCercanas && (
            <div className="mt-3">
              <ErrorBanner mensaje={errorCercanas} />
            </div>
          )}

          {resultadoCercanas && resultadoCercanas.length === 0 && (
            <div className="mt-3">
              <EstadoVacio titulo="Nada por aquí cerca" descripcion="Intenta con un límite de minutos mayor." />
            </div>
          )}

          {resultadoCercanas && resultadoCercanas.length > 0 && (
            <ul className="mt-3 flex flex-col divide-y divide-(--color-border)">
              {resultadoCercanas.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.nombre}</span>
                    <BadgeZona zona={a.zona} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-(--color-accent)">
                    <IconClock size={12} /> {a.distancia} min
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      )}

      {sub === 'plan' && (
        <Seccion titulo="Planificar recorrido" icono={<IconList size={16} />}>
          <form onSubmit={planificar} className="flex flex-col gap-3">
            <SelectorAtraccion atracciones={atracciones} value={origenPlan} onChange={setOrigenPlan} etiqueta="Punto de partida" />

            <Campo etiqueta={`Paradas a visitar (${paradas.size} seleccionadas)`} requerido>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-(--color-border) p-2">
                {atracciones
                  .filter((a) => a.id !== origenPlan)
                  .map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-(--color-surface-muted)">
                      <input
                        type="checkbox"
                        checked={paradas.has(a.id)}
                        onChange={() => alternarParada(a.id)}
                        className="cursor-pointer accent-(--color-primary)"
                      />
                      {a.nombre}
                    </label>
                  ))}
              </div>
            </Campo>

            <Boton type="submit" disabled={cargandoPlan || !origenPlan || paradas.size === 0}>
              {cargandoPlan ? 'Planificando…' : 'Planificar recorrido'}
            </Boton>
          </form>

          {errorPlan && (
            <div className="mt-3">
              <ErrorBanner mensaje={errorPlan} />
            </div>
          )}

          {resultadoPlan && (
            <div className="mt-4 border-t border-(--color-border) pt-3">
              <p className="mb-2 text-sm font-semibold text-(--color-foreground)">
                Distancia total: <span className="text-(--color-accent)">{resultadoPlan.distanciaTotal} min</span>
                {' · '}
                {resultadoPlan.alcanzadas} de {resultadoPlan.alcanzadas + resultadoPlan.noAlcanzadas.length} paradas alcanzadas
              </p>
              <ol className="flex flex-col gap-1.5">
                {resultadoPlan.ordenVisita.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-primary)/10 text-[10px] font-bold text-(--color-primary)">
                      {i + 1}
                    </span>
                    <span className="font-medium">{p.nombre}</span>
                    <BadgeZona zona={p.zona} />
                  </li>
                ))}
              </ol>
              {resultadoPlan.noAlcanzadas.length > 0 && (
                <p className="mt-2 text-xs text-(--color-destructive)">
                  Inalcanzables: {resultadoPlan.noAlcanzadas.map((p) => p.nombre).join(', ')}
                </p>
              )}
            </div>
          )}
        </Seccion>
      )}
    </div>
  );
}
