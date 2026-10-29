import { useId } from "react"

import { Input } from "@/compartido/componentes/ui/input"
import { Label } from "@/compartido/componentes/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { cn } from "@/compartido/utilidades/cn"

// Etiqueta sobre el borde superior del control; no ocupa una línea propia.
const ETIQUETA_FLOTANTE =
  "pointer-events-none absolute left-2 -translate-y-1/2 rounded-sm px-1 leading-none font-normal text-muted-foreground transition-all"
const ETIQUETA_ARRIBA = "top-0 bg-card text-xs"

/**
 * Campo de texto de un filtro con etiqueta flotante: se muestra dentro del
 * campo como placeholder y sube al borde al enfocarlo o cuando tiene valor.
 */
export function CampoFiltroTexto({
  etiqueta,
  valor,
  onCambio,
  inputMode,
  className,
}: {
  etiqueta: string
  valor: string
  onCambio: (valor: string) => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn("relative", className)}>
      {/* placeholder " " habilita :placeholder-shown para saber si está vacío */}
      <Input
        id={id}
        className="peer"
        placeholder=" "
        value={valor}
        inputMode={inputMode}
        onChange={(evento) => onCambio(evento.target.value)}
      />
      <Label
        htmlFor={id}
        className={cn(
          ETIQUETA_FLOTANTE,
          "top-1/2 text-sm",
          "peer-focus:top-0 peer-focus:bg-card peer-focus:text-xs",
          "peer-not-placeholder-shown:top-0 peer-not-placeholder-shown:bg-card peer-not-placeholder-shown:text-xs"
        )}
      >
        {etiqueta}
      </Label>
    </div>
  )
}

/**
 * Combo de un filtro. Siempre tiene una opción seleccionada (ej. "Todos"),
 * por eso su etiqueta va fija sobre el borde.
 */
export function CampoFiltroSeleccion({
  etiqueta,
  opciones,
  valor,
  onCambio,
  className,
}: {
  etiqueta: string
  opciones: { value: string; label: string }[]
  valor: string
  onCambio: (valor: string) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn("relative", className)}>
      <Select
        items={opciones}
        value={valor}
        onValueChange={(nuevo) =>
          onCambio(typeof nuevo === "string" ? nuevo : "")
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label htmlFor={id} className={cn(ETIQUETA_FLOTANTE, ETIQUETA_ARRIBA)}>
        {etiqueta}
      </Label>
    </div>
  )
}
