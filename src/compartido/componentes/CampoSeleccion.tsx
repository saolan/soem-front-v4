import { useId } from "react"
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form"

import type { ComboDTO } from "@/compartido/api/esquemas"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"

interface PropsCampoSeleccion<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  etiqueta: string
  /** Opciones de un `/recurso/combo`. */
  opciones: ComboDTO[]
  placeholder?: string
  disabled?: boolean
}

/** Lista desplegable de un combo (`valor` numérico) para React Hook Form. */
export function CampoSeleccion<T extends FieldValues>({
  control,
  name,
  etiqueta,
  opciones,
  placeholder = "Seleccione…",
  disabled,
}: PropsCampoSeleccion<T>) {
  const idCampo = useId()
  const idError = `${idCampo}-error`
  const items = opciones.map(({ valor, etiqueta: texto }) => ({
    value: valor,
    label: texto,
  }))

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={idCampo}>{etiqueta}</FieldLabel>
          <Select
            items={items}
            value={field.value ?? null}
            onValueChange={field.onChange}
            disabled={disabled}
            inputRef={field.ref}
            name={field.name}
          >
            <SelectTrigger
              id={idCampo}
              className="w-full"
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? idError : undefined}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && (
            <FieldError id={idError} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}
