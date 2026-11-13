import { EtiquetaEstado } from "@/compartido/componentes/EtiquetaEstado"
import { Badge } from "@/compartido/componentes/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { formatoDecimal } from "@/compartido/utilidades/numero"
import {
  ETIQUETAS_ALCANCE,
  type PrecioDTO,
} from "@/modulos/configuracion/esquemas/precio"

/** Presentación de una lista de precio en el listado móvil. */
export function TarjetaPrecio({
  precio,
  acciones,
}: {
  precio: PrecioDTO
  acciones: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{precio.descri}</CardTitle>
        <CardAction>{acciones}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Código</dt>
          <dd className="tabular-nums">{precio.codigo}</dd>
          <dt className="text-muted-foreground">Factor</dt>
          <dd className="tabular-nums">{formatoDecimal(precio.factor)}</dd>
        </dl>
        <div className="flex gap-2">
          <Badge variant="secondary">
            <span className="sr-only">Alcance </span>
            {ETIQUETAS_ALCANCE[precio.alcanc]}
          </Badge>
          <EtiquetaEstado activo={precio.estado} />
        </div>
      </CardContent>
    </Card>
  )
}
