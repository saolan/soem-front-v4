/**
 * Botones de un formulario largo, fijos al pie del área de contenido. Debe ir
 * dentro del `<form>` para que solo quede fija mientras el formulario es
 * visible.
 */
export function BarraAccionesFormulario({
  pendiente,
  children,
}: {
  /** Hay cambios sin guardar. */
  pendiente: boolean
  children: React.ReactNode
}) {
  return (
    <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
      {/* Región viva siempre montada para que se anuncie el cambio. */}
      <p role="status" className="mr-auto text-sm text-muted-foreground">
        {pendiente ? "Cambios sin guardar" : ""}
      </p>
      {children}
    </div>
  )
}
