import { EtiquetaEstado } from "@/compartido/componentes/EtiquetaEstado"
import { Badge } from "@/compartido/componentes/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import type { SucursalDTO } from "@/modulos/configuracion/esquemas/sucursal"

/** Presentación de una sucursal en el listado móvil. */
export function TarjetaSucursal({
  sucursal,
  acciones,
}: {
  sucursal: SucursalDTO
  acciones: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{sucursal.descri}</CardTitle>
        <CardAction>{acciones}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Código</dt>
          <dd className="tabular-nums">{sucursal.codigo}</dd>
          <dt className="text-muted-foreground">RUC</dt>
          <dd className="tabular-nums">{sucursal.ruc}</dd>
        </dl>
        <div className="flex gap-2">
          {sucursal.matriz && <Badge variant="secondary">Matriz</Badge>}
          <EtiquetaEstado activo={sucursal.estado} />
        </div>
      </CardContent>
    </Card>
  )
}
