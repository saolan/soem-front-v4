import { EyeIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react"
import { useLocation } from "react-router"

import { BotonIcono, EnlaceIcono } from "@/compartido/componentes/BotonIcono"
import { estadoRetorno } from "@/compartido/hooks/useRutaRetorno"
import { rutaSucursal } from "@/modulos/configuracion/constantes"
import type { SucursalDTO } from "@/modulos/configuracion/esquemas/sucursal"

interface PropsAccionesSucursal {
  sucursal: SucursalDTO
  puedeModificar: boolean
  puedeEliminar: boolean
  onEliminar: (sucursal: SucursalDTO) => void
  onActivar: (sucursal: SucursalDTO) => void
  /** Hay una reactivación en curso (evita envíos duplicados). */
  activando: boolean
}

/** Modificar (o ver), eliminar o activar una sucursal del listado. */
export function AccionesSucursal({
  sucursal,
  puedeModificar,
  puedeEliminar,
  onEliminar,
  onActivar,
  activando,
}: PropsAccionesSucursal) {
  // El detalle vuelve al listado con sus filtros, orden y página.
  const { search } = useLocation()
  const accionDetalle = puedeModificar ? "Modificar" : "Ver"
  return (
    <div className="flex items-center gap-1">
      <EnlaceIcono
        etiqueta={accionDetalle}
        ruta={rutaSucursal(sucursal.sucursalId)}
        estado={estadoRetorno(search)}
        className="text-primary hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent"
        aria-label={`${accionDetalle} ${sucursal.descri}`}
      >
        {puedeModificar ? (
          <PencilIcon aria-hidden="true" />
        ) : (
          <EyeIcon aria-hidden="true" />
        )}
      </EnlaceIcono>
      {/* Borrado lógico: la activa se elimina y la inactiva se reactiva. */}
      {puedeEliminar && sucursal.estado && (
        <BotonIcono
          etiqueta="Eliminar"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Eliminar ${sucursal.descri}`}
          onClick={() => onEliminar(sucursal)}
        >
          <Trash2Icon aria-hidden="true" />
        </BotonIcono>
      )}
      {puedeEliminar && !sucursal.estado && (
        <BotonIcono
          etiqueta="Activar"
          aria-label={`Activar ${sucursal.descri}`}
          disabled={activando}
          onClick={() => onActivar(sucursal)}
        >
          <RotateCcwIcon aria-hidden="true" />
        </BotonIcono>
      )}
    </div>
  )
}
