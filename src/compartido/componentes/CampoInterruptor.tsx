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
}

/** Interruptor sí/no con etiqueta, ayuda y error asociados. */
export function CampoInterruptor<T extends FieldValues>({
  control,
  name,
  etiqueta,
  descripcion,
  disabled,
}: PropsCampoInterruptor<T>) {
  const idCampo = useId()
  const idError = `${idCampo}-error`
  const idDescripcion = `${idCampo}-descripcion`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
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
          <FieldContent>
            <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
            {descripcion && (
              <FieldDescription id={idDescripcion}>
                {descripcion}
              </FieldDescription>
            )}
            {fieldState.error && (
              <FieldError id={idError} errors={[fieldState.error]} />
            )}
          </FieldContent>
        </Field>
      )}
    />
  )
}
