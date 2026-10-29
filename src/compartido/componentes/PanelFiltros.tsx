import { ChevronDownIcon, FilterIcon } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/compartido/componentes/ui/button"
import { cn } from "@/compartido/utilidades/cn"

/**
 * Contenedor de los filtros de un listado. En móvil se pliega tras un botón
 * "Filtros" para que la lista quede visible; desde `md` siempre está abierto.
 */
export function PanelFiltros({
  etiqueta,
  activos,
  children,
}: {
  /** Nombre accesible de la región de búsqueda (ej. "Filtros de sucursales"). */
  etiqueta: string
  /** Cantidad de filtros aplicados; se muestra en el botón de móvil. */
  activos: number
  children: React.ReactNode
}) {
  const idContenido = useId()
  const [abierto, setAbierto] = useState(false)

  return (
    <div role="search" aria-label={etiqueta} className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="self-start md:hidden"
        aria-expanded={abierto}
        aria-controls={idContenido}
        onClick={() => setAbierto((previo) => !previo)}
      >
        <FilterIcon aria-hidden="true" />
        Filtros
        {activos > 0 && ` (${activos})`}
        <ChevronDownIcon
          aria-hidden="true"
          className={cn("transition-transform", abierto && "rotate-180")}
        />
      </Button>
      <div id={idContenido} className={cn(!abierto && "hidden", "md:block")}>
        {children}
      </div>
    </div>
  )
}
