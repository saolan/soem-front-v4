import { useId } from "react"
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form"

import { EtiquetaCampo } from "@/compartido/componentes/EtiquetaCampo"
import {
  Field,
  FieldDescription,
  FieldError,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"

interface PropsCampoFormulario<T extends FieldValues> extends Omit<
  React.ComponentProps<typeof Input>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur"
> {
  control: Control<T>
  name: Path<T>
  etiqueta: string
  /** Texto de ayuda bajo el control, asociado con aria-describedby. */
  descripcion?: string
  /** Marca el campo como obligatorio (asterisco y `aria-required`). */
  obligatorio?: boolean
}

/** Campo de texto con etiqueta y error asociados (React Hook Form). */
export function CampoFormulario<T extends FieldValues>({
  control,
  name,
  etiqueta,
  descripcion,
  obligatorio = false,
  id,
  ...props
}: PropsCampoFormulario<T>) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idError = `${idCampo}-error`
  const idDescripcion = `${idCampo}-descripcion`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <EtiquetaCampo htmlFor={idCampo} obligatorio={obligatorio}>
            {etiqueta}
          </EtiquetaCampo>
          <Input
            {...props}
            {...field}
            value={field.value ?? ""}
            id={idCampo}
            aria-required={obligatorio || undefined}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              [descripcion && idDescripcion, fieldState.error && idError]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {descripcion && (
            <FieldDescription id={idDescripcion}>
              {descripcion}
            </FieldDescription>
          )}
          {fieldState.error && (
            <FieldError id={idError} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}
