import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api/client';
import MapaParque from './components/MapaParque';
import PanelExplorar from './components/PanelExplorar';
import PanelRutas from './components/PanelRutas';
import PanelAdmin from './components/PanelAdmin';
import TarjetaSeleccion from './components/TarjetaSeleccion';
import { CargandoLinea, ErrorBanner, EstadoVacio } from './components/ui/common';
import { IconFerrisWheel, IconSearch, IconRoute, IconSettings } from './components/ui/Icons';

const TABS = [
  { id: 'explorar', label: 'Explorar', icono: IconSearch },
  { id: 'rutas', label: 'Rutas', icono: IconRoute },
  { id: 'admin', label: 'Admin', icono: IconSettings },
];

export default function App() {
  const [atracciones, setAtracciones] = useState([]);
  const [caminos, setCaminos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState('explorar');
  const [refreshKey, setRefreshKey] = useState(0);

  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  const [rutaResaltada, setRutaResaltada] = useState(null);
  const [nodosCercanos, setNodosCercanos] = useState(null);

  const cargarDatos = useCallback(async ({ mostrarSpinner = true } = {}) => {
    if (mostrarSpinner) setCargando(true);
    setError('');
    try {
      const [listaAtracciones, listaCaminos] = await Promise.all([api.listarAtracciones(), api.listarCaminos()]);
      setAtracciones(listaAtracciones);
      setCaminos(listaCaminos);
      // si la atraccion seleccionada fue editada o eliminada, refleja el cambio (o limpia la tarjeta)
      setNodoSeleccionado((actual) => (actual ? listaAtracciones.find((a) => a.id === actual.id) || null : null));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado al cargar el parque');
    } finally {
      if (mostrarSpinner) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const manejarCambioDeDatos = () => {
    cargarDatos({ mostrarSpinner: false });
    setRefreshKey((k) => k + 1);
  };

  const seleccionarAtraccion = (atraccion) => {
    setNodoSeleccionado(atraccion);
    setRutaResaltada(null);
    setNodosCercanos(null);
  };

  const manejarVisitaRegistrada = (atraccionActualizada) => {
    setNodoSeleccionado(atraccionActualizada);
    manejarCambioDeDatos();
  };

  const manejarResultadoRuta = (ids) => {
    setRutaResaltada(ids);
    if (ids) setNodosCercanos(null);
  };

  const manejarResultadoCercanas = (lista) => {
    setNodosCercanos(lista);
    if (lista) setRutaResaltada(null);
  };

  return (
    <div className="min-h-screen bg-(--color-background)">
      <header className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-6 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-primary) text-(--color-primary-foreground)">
            <IconFerrisWheel size={22} />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight text-(--color-foreground)">Parque Aventura Andina</h1>
            <p className="text-xs text-(--color-muted-foreground)">Rutas y gestión de atracciones · AVL + Grafo en memoria</p>
          </div>
          {!cargando && !error && (
            <div className="ml-auto flex gap-4 text-right text-xs text-(--color-muted-foreground)">
              <div>
                <p className="font-display text-base font-bold text-(--color-foreground)">{atracciones.length}</p>
                atracciones
              </div>
              <div>
                <p className="font-display text-base font-bold text-(--color-foreground)">{caminos.length}</p>
                caminos
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {cargando && <CargandoLinea texto="Cargando el parque desde el servidor…" />}

        {!cargando && error && (
          <div className="mx-auto max-w-lg py-16">
            <ErrorBanner mensaje={error} onReintentar={cargarDatos} />
          </div>
        )}

        {!cargando && !error && atracciones.length === 0 && (
          <div className="py-16">
            <EstadoVacio
              titulo="El parque está vacío"
              descripcion="Configura MONGODB_URI en backend/.env y ejecuta `npm run seed` en la carpeta backend para cargar el dataset inicial."
            />
          </div>
        )}

        {!cargando && !error && atracciones.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
            <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
              <MapaParque
                atracciones={atracciones}
                caminos={caminos}
                rutaResaltada={rutaResaltada}
                nodosCercanos={nodosCercanos}
                nodoSeleccionadoId={nodoSeleccionado?.id}
                onSeleccionarNodo={seleccionarAtraccion}
              />
            </div>

            <div className="flex flex-col gap-4">
              {nodoSeleccionado && (
                <TarjetaSeleccion
                  atraccion={nodoSeleccionado}
                  onCerrar={() => setNodoSeleccionado(null)}
                  onVisitaRegistrada={manejarVisitaRegistrada}
                />
              )}

              <div className="flex gap-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-1 shadow-sm">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${
                      tab === t.id
                        ? 'bg-(--color-primary) text-(--color-primary-foreground)'
                        : 'text-(--color-muted-foreground) hover:bg-(--color-surface-muted)'
                    }`}
                  >
                    <t.icono size={15} />
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === 'explorar' && <PanelExplorar refreshKey={refreshKey} onSeleccionarAtraccion={seleccionarAtraccion} />}
              {tab === 'rutas' && (
                <PanelRutas atracciones={atracciones} onResultadoRuta={manejarResultadoRuta} onResultadoCercanas={manejarResultadoCercanas} />
              )}
              {tab === 'admin' && <PanelAdmin atracciones={atracciones} onCambio={manejarCambioDeDatos} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
