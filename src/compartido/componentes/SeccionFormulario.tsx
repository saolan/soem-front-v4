import { useId } from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { FieldGroup } from "@/compartido/componentes/ui/field"
import { cn } from "@/compartido/utilidades/cn"

/** Sección de un formulario largo presentada como tarjeta con título. */
export function SeccionFormulario({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string
  descripcion?: React.ReactNode
  /** Contenido a la derecha del título (ej. una insignia de estado). */
  accion?: React.ReactNode
  /** Sin contenido la tarjeta muestra solo el encabezado. */
  children?: React.ReactNode
}) {
  const idTitulo = useId()

  return (
    <section aria-labelledby={idTitulo}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id={idTitulo} className="text-lg font-semibold">
              {titulo}
            </h2>
          </CardTitle>
          {descripcion && <CardDescription>{descripcion}</CardDescription>}
          {accion && <CardAction>{accion}</CardAction>}
        </CardHeader>
        {children && (
          <CardContent className="flex flex-col gap-6">{children}</CardContent>
        )}
      </Card>
    </section>
  )
}

/** Grilla adaptable de campos: 1 columna en móvil, 2 en `sm` y 3 en `xl`. */
export function GrillaCampos({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <FieldGroup
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
    >
      {children}
    </FieldGroup>
  )
}
