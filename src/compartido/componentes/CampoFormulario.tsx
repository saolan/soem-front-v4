import { useId } from "react"
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form"

import {
  Field,
  FieldError,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"

interface PropsCampoFormulario<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur"
> {
  control: Control<T>
  name: Path<T>
  etiqueta: string
}

/** Campo de texto con etiqueta y error asociados (React Hook Form). */
export function CampoFormulario<T extends FieldValues>({
  control,
  name,
  etiqueta,
  id,
  ...props
}: PropsCampoFormulario<T>) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idError = `${idCampo}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
          <Input
            {...props}
            {...field}
            id={idCampo}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? idError : undefined}
          />
          {fieldState.error && (
            <FieldError id={idError} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}
