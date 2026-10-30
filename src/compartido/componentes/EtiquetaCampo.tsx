import { FieldLabel } from "@/compartido/componentes/ui/field"

/**
 * Etiqueta de un campo con la marca de obligatorio. El asterisco queda fuera
 * del `<label>` y oculto a lectores de pantalla: el nombre accesible sigue
 * siendo la etiqueta y el control anuncia la obligatoriedad con
 * `aria-required`.
 */
export function EtiquetaCampo({
  htmlFor,
  obligatorio = false,
  children,
}: {
  htmlFor: string
  obligatorio?: boolean
  children: React.ReactNode
}) {
  if (!obligatorio) {
    return <FieldLabel htmlFor={htmlFor}>{children}</FieldLabel>
  }
  return (
    <div className="flex items-baseline gap-1">
      <FieldLabel htmlFor={htmlFor}>{children}</FieldLabel>
      <span aria-hidden="true" className="text-destructive">
        *
      </span>
    </div>
  )
}
