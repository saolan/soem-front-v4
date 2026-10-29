/** Título de una pantalla con sus acciones principales (ej. Nuevo). */
export function EncabezadoPagina({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="flex gap-2 font-heading text-2xl font-semibold">
          {/* Barra decorativa con el alto de la línea del título */}
          <span aria-hidden="true" className="w-1 rounded-full bg-ambar" />
          {titulo}
        </h1>
        {descripcion && <p className="text-muted-foreground">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  )
}
