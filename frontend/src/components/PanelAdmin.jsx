import { useState } from 'react';
import { api, ApiError } from '../api/client';
import { Seccion, Boton, Campo, claseInput } from './ui/common';
import { IconPlus, IconRoute, IconPencil, IconTrash } from './ui/Icons';
import { listaZonas } from '../lib/zonas';

function Notificacion({ estado }) {
  if (!estado) return null;
  const esError = estado.tipo === 'error';
  return (
    <p className={`mt-2 text-xs font-medium ${esError ? 'text-(--color-destructive)' : 'text-emerald-600'}`}>
      {estado.mensaje}
    </p>
  );
}

export default function PanelAdmin({ atracciones, onCambio }) {
  // --- Agregar atracción ---
  const [nombre, setNombre] = useState('');
  const [zona, setZona] = useState(listaZonas()[0]);
  const [x, setX] = useState(400);
  const [y, setY] = useState(300);
  const [espera, setEspera] = useState(0);
  const [estadoAtraccion, setEstadoAtraccion] = useState(null);
  const [enviandoAtraccion, setEnviandoAtraccion] = useState(false);

  const crearAtraccion = async (e) => {
    e.preventDefault();
    setEnviandoAtraccion(true);
    setEstadoAtraccion(null);
    try {
      await api.crearAtraccion({ nombre, zona, tiempoEsperaFila: Number(espera), coordenadas: { x: Number(x), y: Number(y) } });
      setEstadoAtraccion({ tipo: 'ok', mensaje: `"${nombre}" agregada correctamente.` });
      setNombre('');
      onCambio();
    } catch (err) {
      setEstadoAtraccion({ tipo: 'error', mensaje: err instanceof ApiError ? err.message : 'No se pudo crear la atracción' });
    } finally {
      setEnviandoAtraccion(false);
    }
  };

  // --- Agregar camino ---
  const [origenCamino, setOrigenCamino] = useState('');
  const [destinoCamino, setDestinoCamino] = useState('');
  const [tiempoCaminata, setTiempoCaminata] = useState(3);
  const [estadoCamino, setEstadoCamino] = useState(null);
  const [enviandoCamino, setEnviandoCamino] = useState(false);

  const crearCamino = async (e) => {
    e.preventDefault();
    setEnviandoCamino(true);
    setEstadoCamino(null);
    try {
      await api.crearCamino({ origen: origenCamino, destino: destinoCamino, tiempoCaminata: Number(tiempoCaminata) });
      setEstadoCamino({ tipo: 'ok', mensaje: 'Camino agregado correctamente.' });
      onCambio();
    } catch (err) {
      setEstadoCamino({ tipo: 'error', mensaje: err instanceof ApiError ? err.message : 'No se pudo crear el camino' });
    } finally {
      setEnviandoCamino(false);
    }
  };

  // --- Editar / eliminar atracción ---
  const [idSeleccionado, setIdSeleccionado] = useState('');
  const [formEdicion, setFormEdicion] = useState(null);
  const [estadoEdicion, setEstadoEdicion] = useState(null);
  const [enviandoEdicion, setEnviandoEdicion] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [estadoEliminar, setEstadoEliminar] = useState(null);

  const seleccionarParaEditar = (id) => {
    setIdSeleccionado(id);
    setConfirmandoEliminar(false);
    setEstadoEdicion(null);
    setEstadoEliminar(null);
    const a = atracciones.find((at) => at.id === id);
    setFormEdicion(
      a ? { nombre: a.nombre, zona: a.zona, x: a.coordenadas.x, y: a.coordenadas.y, tiempoEsperaFila: a.tiempoEsperaFila } : null
    );
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setEnviandoEdicion(true);
    setEstadoEdicion(null);
    try {
      await api.editarAtraccion(idSeleccionado, {
        nombre: formEdicion.nombre,
        zona: formEdicion.zona,
        tiempoEsperaFila: Number(formEdicion.tiempoEsperaFila),
        coordenadas: { x: Number(formEdicion.x), y: Number(formEdicion.y) },
      });
      setEstadoEdicion({ tipo: 'ok', mensaje: 'Cambios guardados.' });
      onCambio();
    } catch (err) {
      setEstadoEdicion({ tipo: 'error', mensaje: err instanceof ApiError ? err.message : 'No se pudo guardar' });
    } finally {
      setEnviandoEdicion(false);
    }
  };

  const eliminarAtraccion = async () => {
    setEliminando(true);
    setEstadoEliminar(null);
    try {
      await api.eliminarAtraccion(idSeleccionado);
      setIdSeleccionado('');
      setFormEdicion(null);
      setConfirmandoEliminar(false);
      onCambio();
    } catch (err) {
      setEstadoEliminar({ tipo: 'error', mensaje: err instanceof ApiError ? err.message : 'No se pudo eliminar' });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Seccion titulo="Agregar atracción" icono={<IconPlus size={16} />}>
        <form onSubmit={crearAtraccion} className="flex flex-col gap-3">
          <Campo etiqueta="Nombre" requerido>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseInput} required />
          </Campo>
          <Campo etiqueta="Zona" requerido>
            <select value={zona} onChange={(e) => setZona(e.target.value)} className={`${claseInput} cursor-pointer`}>
              {listaZonas().map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Coordenada X" ayuda="0–860" requerido>
              <input type="number" min="0" max="860" value={x} onChange={(e) => setX(e.target.value)} className={claseInput} required />
            </Campo>
            <Campo etiqueta="Coordenada Y" ayuda="0–640" requerido>
              <input type="number" min="0" max="640" value={y} onChange={(e) => setY(e.target.value)} className={claseInput} required />
            </Campo>
          </div>
          <Campo etiqueta="Tiempo de espera inicial (min)">
            <input type="number" min="0" value={espera} onChange={(e) => setEspera(e.target.value)} className={claseInput} />
          </Campo>
          <Boton type="submit" variante="acento" disabled={enviandoAtraccion}>
            {enviandoAtraccion ? 'Guardando…' : 'Agregar atracción'}
          </Boton>
          <Notificacion estado={estadoAtraccion} />
        </form>
      </Seccion>

      <Seccion titulo="Agregar camino" icono={<IconRoute size={16} />}>
        <form onSubmit={crearCamino} className="flex flex-col gap-3">
          <Campo etiqueta="Origen" requerido>
            <select value={origenCamino} onChange={(e) => setOrigenCamino(e.target.value)} className={`${claseInput} cursor-pointer`} required>
              <option value="">Selecciona…</option>
              {atracciones.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === destinoCamino}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Destino" requerido>
            <select value={destinoCamino} onChange={(e) => setDestinoCamino(e.target.value)} className={`${claseInput} cursor-pointer`} required>
              <option value="">Selecciona…</option>
              {atracciones.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === origenCamino}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Tiempo de caminata (min)" requerido>
            <input
              type="number"
              min="0"
              value={tiempoCaminata}
              onChange={(e) => setTiempoCaminata(e.target.value)}
              className={claseInput}
              required
            />
          </Campo>
          <Boton type="submit" variante="acento" disabled={enviandoCamino || !origenCamino || !destinoCamino}>
            {enviandoCamino ? 'Guardando…' : 'Agregar camino'}
          </Boton>
          <Notificacion estado={estadoCamino} />
        </form>
      </Seccion>

      <Seccion titulo="Editar o eliminar atracción" icono={<IconPencil size={16} />}>
        <Campo etiqueta="Atracción">
          <select
            value={idSeleccionado}
            onChange={(e) => seleccionarParaEditar(e.target.value)}
            className={`${claseInput} cursor-pointer`}
          >
            <option value="">Selecciona…</option>
            {atracciones.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>

        {formEdicion && (
          <>
            <form onSubmit={guardarEdicion} className="mt-3 flex flex-col gap-3">
              <Campo etiqueta="Nombre" requerido>
                <input
                  value={formEdicion.nombre}
                  onChange={(e) => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                  className={claseInput}
                  required
                />
              </Campo>
              <Campo etiqueta="Zona" requerido>
                <select
                  value={formEdicion.zona}
                  onChange={(e) => setFormEdicion({ ...formEdicion, zona: e.target.value })}
                  className={`${claseInput} cursor-pointer`}
                >
                  {listaZonas().map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Coordenada X" ayuda="0–860" requerido>
                  <input
                    type="number"
                    min="0"
                    max="860"
                    value={formEdicion.x}
                    onChange={(e) => setFormEdicion({ ...formEdicion, x: e.target.value })}
                    className={claseInput}
                    required
                  />
                </Campo>
                <Campo etiqueta="Coordenada Y" ayuda="0–640" requerido>
                  <input
                    type="number"
                    min="0"
                    max="640"
                    value={formEdicion.y}
                    onChange={(e) => setFormEdicion({ ...formEdicion, y: e.target.value })}
                    className={claseInput}
                    required
                  />
                </Campo>
              </div>
              <Campo etiqueta="Tiempo de espera (min)" requerido>
                <input
                  type="number"
                  min="0"
                  value={formEdicion.tiempoEsperaFila}
                  onChange={(e) => setFormEdicion({ ...formEdicion, tiempoEsperaFila: e.target.value })}
                  className={claseInput}
                  required
                />
              </Campo>
              <Boton type="submit" variante="acento" disabled={enviandoEdicion}>
                {enviandoEdicion ? 'Guardando…' : 'Guardar cambios'}
              </Boton>
              <Notificacion estado={estadoEdicion} />
            </form>

            <div className="mt-4 border-t border-(--color-border) pt-3">
              {!confirmandoEliminar ? (
                <Boton variante="peligro" onClick={() => setConfirmandoEliminar(true)}>
                  <IconTrash size={14} />
                  Eliminar atracción
                </Boton>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">
                    ¿Eliminar "{formEdicion.nombre}"? También se eliminarán todos sus caminos. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <Boton variante="peligro" onClick={eliminarAtraccion} disabled={eliminando}>
                      {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
                    </Boton>
                    <Boton variante="fantasma" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando}>
                      Cancelar
                    </Boton>
                  </div>
                </div>
              )}
              <Notificacion estado={estadoEliminar} />
            </div>
          </>
        )}
      </Seccion>
    </div>
  );
}
