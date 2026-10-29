import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { BotonIcono, EnlaceIcono } from "@/compartido/componentes/BotonIcono"
import type { SucursalDTO } from "@/modulos/configuracion/esquemas/sucursal"

interface PropsAccionesSucursal {
  sucursal: SucursalDTO
  puedeModificar: boolean
  puedeEliminar: boolean
  onEliminar: (sucursal: SucursalDTO) => void
}

/** Modificar (o ver) y eliminar una sucursal del listado. */
export function AccionesSucursal({
  sucursal,
  puedeModificar,
  puedeEliminar,
  onEliminar,
}: PropsAccionesSucursal) {
  const accionDetalle = puedeModificar ? "Modificar" : "Ver"
  return (
    <div className="flex items-center gap-1">
      <EnlaceIcono
        etiqueta={accionDetalle}
        ruta={`/configuracion/sucursales/${sucursal.sucursalId}`}
        className="text-primary hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent"
        aria-label={`${accionDetalle} ${sucursal.descri}`}
      >
        {puedeModificar ? (
          <PencilIcon aria-hidden="true" />
        ) : (
          <EyeIcon aria-hidden="true" />
        )}
      </EnlaceIcono>
      {/* El borrado es lógico: una sucursal inactiva ya está eliminada. */}
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
    </div>
  )
}
