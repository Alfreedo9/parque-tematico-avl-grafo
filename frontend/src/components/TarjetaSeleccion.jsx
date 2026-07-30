import { useState } from 'react';
import { api, ApiError } from '../api/client';
import { Boton, BadgeZona } from './ui/common';
import { IconX, IconUsers, IconClock, IconSparkles } from './ui/Icons';

export default function TarjetaSeleccion({ atraccion, onCerrar, onVisitaRegistrada }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (!atraccion) return null;

  const registrarVisita = async () => {
    setEnviando(true);
    setError('');
    try {
      const actualizada = await api.registrarVisita(atraccion.id);
      onVisitaRegistrada(actualizada);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la visita');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/5 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold text-(--color-foreground)">{atraccion.nombre}</p>
          <div className="mt-1">
            <BadgeZona zona={atraccion.zona} />
          </div>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="cursor-pointer rounded-full p-1 text-(--color-muted-foreground) hover:bg-(--color-surface) hover:text-(--color-foreground)"
          aria-label="Cerrar"
        >
          <IconX size={16} />
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-(--color-muted-foreground)">
        <span className="inline-flex items-center gap-1">
          <IconUsers size={13} /> Popularidad {atraccion.popularidad}
        </span>
        <span className="inline-flex items-center gap-1">
          <IconClock size={13} /> Espera {atraccion.tiempoEsperaFila} min
        </span>
      </div>

      <Boton variante="acento" className="mt-1" onClick={registrarVisita} disabled={enviando}>
        <IconSparkles size={14} />
        {enviando ? 'Registrando…' : 'Registrar visita (+1 popularidad)'}
      </Boton>
      {error && <p className="text-xs font-medium text-(--color-destructive)">{error}</p>}
    </div>
  );
}
