import { OPCION_FILTRO_TODO } from "@/compartido/componentes/CampoFiltro"
import { Badge } from "@/compartido/componentes/ui/badge"

/**
 * Textos del campo `estado` (borrado lógico). Son los mismos para todo
 * registro, sin concordar con el género del recurso.
 */
export const TEXTO_ESTADO = { activo: "Activo", inactivo: "Inactivo" } as const

/** Opciones del filtro por `estado` de los listados. */
export const OPCIONES_FILTRO_ESTADO = [
  OPCION_FILTRO_TODO,
  { value: "true", label: TEXTO_ESTADO.activo },
  { value: "false", label: TEXTO_ESTADO.inactivo },
]

/** Estado activo/inactivo de un registro. */
export function EtiquetaEstado({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge className="bg-success text-success-foreground">
      {TEXTO_ESTADO.activo}
    </Badge>
  ) : (
    <Badge variant="outline">{TEXTO_ESTADO.inactivo}</Badge>
  )
}
