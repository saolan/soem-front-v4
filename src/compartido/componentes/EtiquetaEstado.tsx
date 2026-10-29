import { Badge } from "@/compartido/componentes/ui/badge"

/** Estado activo/inactivo de un registro. */
export function EtiquetaEstado({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge className="bg-success text-success-foreground">Activo</Badge>
  ) : (
    <Badge variant="outline">Inactivo</Badge>
  )
}
