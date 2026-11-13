import { useId } from "react"
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Switch } from "@/compartido/componentes/ui/switch"

interface PropsCampoInterruptor<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  etiqueta: string
  descripcion?: string
  disabled?: boolean
  /**
   * Muestra junto a la etiqueta el valor actual (ej. "Activo"). Es solo
   * visual: el lector de pantalla ya anuncia si el interruptor está marcado.
   */
  textoValor?: (marcado: boolean) => React.ReactNode
  /**
   * Etiqueta arriba e interruptor abajo, como un campo de texto: para
   * compartir fila con inputs (alinea etiqueta con etiqueta e interruptor con
   * input aunque el vecino tenga texto de ayuda debajo).
   */
  etiquetaArriba?: boolean
}

/** Interruptor sí/no con etiqueta, ayuda y error asociados. */
export function CampoInterruptor<T extends FieldValues>({
  control,
  name,
  etiqueta,
  descripcion,
  disabled,
  textoValor,
  etiquetaArriba = false,
}: PropsCampoInterruptor<T>) {
  const idCampo = useId()
  const idError = `${idCampo}-error`
  const idDescripcion = `${idCampo}-descripcion`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const interruptor = (
          <Switch
            id={idCampo}
            name={field.name}
            checked={field.value === true}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              [descripcion && idDescripcion, fieldState.error && idError]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
        )
        // Solo visual: el lector de pantalla ya anuncia si está marcado.
        const valor = textoValor && (
          <span aria-hidden="true">{textoValor(field.value === true)}</span>
        )
        const ayudaYError = (
          <>
            {descripcion && (
              <FieldDescription id={idDescripcion}>
                {descripcion}
              </FieldDescription>
            )}
            {fieldState.error && (
              <FieldError id={idError} errors={[fieldState.error]} />
            )}
          </>
        )

        // Etiqueta arriba y el interruptor a la altura de un input (h-8):
        // queda alineado con los campos de texto vecinos de la fila.
        if (etiquetaArriba) {
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
              <div className="flex h-8 items-center gap-2">
                {interruptor}
                {valor}
              </div>
              {ayudaYError}
            </Field>
          )
        }

        return (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            {interruptor}
            <FieldContent>
              {valor ? (
                <div className="flex items-center gap-2">
                  <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
                  {valor}
                </div>
              ) : (
                <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
              )}
              {ayudaYError}
            </FieldContent>
          </Field>
        )
      }}
    />
  )
}
