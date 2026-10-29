import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"
import { useId } from "react"

import { paginasDelBloque, TAMANIOS_PAGINA } from "@/compartido/api/paginacion"
import { Button } from "@/compartido/componentes/ui/button"
import { Label } from "@/compartido/componentes/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { cn } from "@/compartido/utilidades/cn"

const formatoEntero = new Intl.NumberFormat("es-EC")
const opcionesTamanio = TAMANIOS_PAGINA.map((t) => ({
  value: t,
  label: String(t),
}))

interface PropsControlesPaginacion {
  pagina: number
  totalPaginas: number
  totalRegistros: number
  tamanio: number
  onPagina: (pagina: number) => void
  onTamanio: (tamanio: number) => void
}

/**
 * Navegación entre páginas (números de cinco en cinco) y selector de
 * registros por página.
 */
export function ControlesPaginacion({
  pagina,
  totalPaginas,
  totalRegistros,
  tamanio,
  onPagina,
  onTamanio,
}: PropsControlesPaginacion) {
  const idTamanio = useId()
  const ultima = Math.max(totalPaginas, 1)

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center gap-3 text-center text-sm sm:flex-row sm:justify-between sm:text-left"
    >
      <p className="text-secondary-foreground" aria-live="polite">
        Página {formatoEntero.format(pagina)} de {formatoEntero.format(ultima)}{" "}
        · {formatoEntero.format(totalRegistros)} registros
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Label
          htmlFor={idTamanio}
          className="font-normal text-secondary-foreground"
        >
          Registros por página
        </Label>
        <Select
          items={opcionesTamanio}
          value={tamanio}
          onValueChange={(valor) => {
            if (typeof valor === "number") {
              onTamanio(valor)
            }
          }}
        >
          <SelectTrigger id={idTamanio} size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opcionesTamanio.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Primera página"
            disabled={pagina <= 1}
            onClick={() => onPagina(1)}
          >
            <ChevronsLeftIcon aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Página anterior"
            disabled={pagina <= 1}
            onClick={() => onPagina(pagina - 1)}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
          {paginasDelBloque(pagina, ultima).map((numero) => {
            const actual = numero === pagina
            return (
              <Button
                key={numero}
                variant="outline"
                size="sm"
                className={cn(
                  "min-w-7 px-2",
                  actual &&
                    "border-primary/40 bg-secondary font-semibold text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground dark:bg-secondary dark:hover:bg-secondary"
                )}
                aria-label={`Página ${formatoEntero.format(numero)}`}
                aria-current={actual ? "page" : undefined}
                onClick={() => {
                  if (!actual) {
                    onPagina(numero)
                  }
                }}
              >
                {formatoEntero.format(numero)}
              </Button>
            )
          })}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Página siguiente"
            disabled={pagina >= ultima}
            onClick={() => onPagina(pagina + 1)}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Última página"
            disabled={pagina >= ultima}
            onClick={() => onPagina(ultima)}
          >
            <ChevronsRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
