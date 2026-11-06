import { useId } from "react"
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from "react-hook-form"

import { MARGEN_DESPLAZAMIENTO_CAMPO } from "@/compartido/componentes/clasesCampo"
import { EtiquetaCampo } from "@/compartido/componentes/EtiquetaCampo"
import {
  Field,
  FieldDescription,
  FieldError,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { cn } from "@/compartido/utilidades/cn"

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
  /** Control dentro del campo, a la derecha (ej. botón para ver la clave). */
  accionFinal?: React.ReactNode
}

/** Campo de texto con etiqueta y error asociados (React Hook Form). */
export function CampoFormulario<T extends FieldValues>({
  control,
  name,
  etiqueta,
  descripcion,
  obligatorio = false,
  id,
  className,
  accionFinal,
  ...props
}: PropsCampoFormulario<T>) {
  const idGenerado = useId()
  const idCampo = id ?? idGenerado
  const idError = `${idCampo}-error`
  const idDescripcion = `${idCampo}-descripcion`

  const entrada = (
    field: ControllerRenderProps<T, Path<T>>,
    fieldState: ControllerFieldState
  ) => (
    <Input
      {...props}
      {...field}
      value={field.value ?? ""}
      id={idCampo}
      className={cn(
        MARGEN_DESPLAZAMIENTO_CAMPO,
        accionFinal !== undefined && "pr-10",
        className
      )}
      aria-required={obligatorio || undefined}
      aria-invalid={fieldState.invalid}
      aria-describedby={
        [descripcion && idDescripcion, fieldState.error && idError]
          .filter(Boolean)
          .join(" ") || undefined
      }
    />
  )

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <EtiquetaCampo htmlFor={idCampo} obligatorio={obligatorio}>
            {etiqueta}
          </EtiquetaCampo>
          {accionFinal === undefined ? (
            entrada(field, fieldState)
          ) : (
            <div className="relative">
              {entrada(field, fieldState)}
              <div className="absolute inset-y-0 right-1 flex items-center">
                {accionFinal}
              </div>
            </div>
          )}
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
