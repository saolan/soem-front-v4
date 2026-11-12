import { EyeIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { useLocation } from "react-router"

import { BotonIcono, EnlaceIcono } from "@/compartido/componentes/BotonIcono"
import { estadoRetorno } from "@/compartido/hooks/useRutaRetorno"

interface PropsAccionesRegistro {
  /** Texto que identifica el registro en los nombres accesibles. */
  descripcion: string
  /** Ruta del detalle (edición o consulta). */
  ruta: string
  activo: boolean
  puedeModificar: boolean
  puedeEliminar: boolean
  onEliminar: () => void
  onActivar: () => void
  /** Hay una reactivación en curso (evita envíos duplicados). */
  activando: boolean
}

/**
 * Acciones de una fila de un listado con borrado lógico: modificar (o ver),
 * eliminar el registro activo o reactivar el inactivo.
 */
export function AccionesRegistro({
  descripcion,
  ruta,
  activo,
  puedeModificar,
  puedeEliminar,
  onEliminar,
  onActivar,
  activando,
}: PropsAccionesRegistro) {
  // El detalle vuelve al listado con sus filtros, orden y página.
  const { search } = useLocation()
  const accionDetalle = puedeModificar ? "Modificar" : "Ver"
  return (
    <div className="flex items-center gap-1">
      <EnlaceIcono
        etiqueta={accionDetalle}
        ruta={ruta}
        estado={estadoRetorno(search)}
        className="text-primary hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent"
        aria-label={`${accionDetalle} ${descripcion}`}
      >
        {puedeModificar ? (
          <PencilIcon aria-hidden="true" />
        ) : (
          <EyeIcon aria-hidden="true" />
        )}
      </EnlaceIcono>
      {/* Borrado lógico: el activo se elimina y el inactivo se reactiva. */}
      {puedeEliminar && activo && (
        <BotonIcono
          etiqueta="Eliminar"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Eliminar ${descripcion}`}
          onClick={onEliminar}
        >
          <Trash2Icon aria-hidden="true" />
        </BotonIcono>
      )}
      {puedeEliminar && !activo && (
        <BotonIcono
          etiqueta="Activar"
          aria-label={`Activar ${descripcion}`}
          disabled={activando}
          onClick={onActivar}
        >
          <RotateCcwIcon aria-hidden="true" />
        </BotonIcono>
      )}
    </div>
  )
}
