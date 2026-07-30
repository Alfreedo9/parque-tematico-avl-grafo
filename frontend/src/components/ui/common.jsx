import { colorDeZona } from '../../lib/zonas';

export function Spinner({ className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Cargando"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function CargandoLinea({ texto = 'Cargando…' }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-(--color-muted-foreground)">
      <Spinner />
      <span>{texto}</span>
    </div>
  );
}

export function ErrorBanner({ mensaje, onReintentar }) {
  if (!mensaje) return null;
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <span>{mensaje}</span>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="shrink-0 cursor-pointer font-semibold underline underline-offset-2 hover:text-red-900"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EstadoVacio({ titulo, descripcion, icono }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-(--color-border) px-4 py-8 text-center">
      {icono}
      <p className="font-display text-sm font-semibold text-(--color-foreground)">{titulo}</p>
      {descripcion && <p className="max-w-xs text-xs text-(--color-muted-foreground)">{descripcion}</p>}
    </div>
  );
}

export function Seccion({ titulo, icono, accion, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm ${className}`}>
      {(titulo || accion) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-display flex items-center gap-2 text-sm font-semibold text-(--color-foreground)">
            {icono}
            {titulo}
          </h3>
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function BadgeZona({ zona }) {
  const color = colorDeZona(zona);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {zona}
    </span>
  );
}

export function Boton({ variante = 'primario', className = '', children, disabled, ...props }) {
  const base =
    'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const variantes = {
    primario: 'bg-(--color-primary) text-(--color-primary-foreground) hover:bg-indigo-700 focus-visible:outline-(--color-primary)',
    acento: 'bg-(--color-accent) text-(--color-accent-foreground) hover:bg-orange-700 focus-visible:outline-(--color-accent)',
    fantasma: 'bg-transparent text-(--color-foreground) hover:bg-(--color-surface-muted) border border-(--color-border)',
    peligro: 'bg-transparent text-(--color-destructive) hover:bg-red-50 border border-red-200',
  };
  return (
    <button className={`${base} ${variantes[variante]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function Campo({ etiqueta, requerido, children, ayuda }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-(--color-foreground)">
        {etiqueta}
        {requerido && <span className="ml-0.5 text-(--color-destructive)">*</span>}
      </span>
      {children}
      {ayuda && <span className="text-xs text-(--color-muted-foreground)">{ayuda}</span>}
    </label>
  );
}

export const claseInput =
  'w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-foreground) outline-none transition-colors focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/20';
