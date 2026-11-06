import { useId } from "react"
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form"

import type { ComboDTO } from "@/compartido/api/esquemas"
import { MARGEN_DESPLAZAMIENTO_CAMPO } from "@/compartido/componentes/clasesCampo"
import { EtiquetaCampo } from "@/compartido/componentes/EtiquetaCampo"
import { Field, FieldError } from "@/compartido/componentes/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { cn } from "@/compartido/utilidades/cn"

interface PropsCampoSeleccion<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  etiqueta: string
  /** Opciones de un `/recurso/combo`. */
  opciones: ComboDTO[]
  placeholder?: string
  disabled?: boolean
  /** Marca el campo como obligatorio (asterisco y `aria-required`). */
  obligatorio?: boolean
  /** Las opciones aún se están cargando. */
  cargando?: boolean
  /**
   * Texto del valor guardado que ya no está entre las opciones (los combos
   * solo traen registros activos).
   */
  etiquetaNoDisponible?: string
  /** Clases adicionales del botón del desplegable (ej. tamaño). */
  className?: string
}

type Item = { value: number; label: string }

/** Lista desplegable de un combo (`valor` numérico) para React Hook Form. */
export function CampoSeleccion<T extends FieldValues>({
  control,
  name,
  etiqueta,
  opciones,
  placeholder = "Seleccione…",
  disabled,
  obligatorio = false,
  cargando = false,
  etiquetaNoDisponible = "Opción no disponible (inactiva)",
  className,
}: PropsCampoSeleccion<T>) {
  const idCampo = useId()
  const idError = `${idCampo}-error`
  const items: Item[] = opciones.map(({ valor, etiqueta: texto }) => ({
    value: valor,
    label: texto,
  }))

  // El valor guardado se rotula aunque no esté en la lista; no se ofrece
  // como opción para que el usuario elija una vigente.
  const itemsConValor = (valor: unknown): Item[] =>
    cargando ||
    typeof valor !== "number" ||
    items.some((item) => item.value === valor)
      ? items
      : [...items, { value: valor, label: etiquetaNoDisponible }]

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <EtiquetaCampo htmlFor={idCampo} obligatorio={obligatorio}>
            {etiqueta}
          </EtiquetaCampo>
          <Select
            items={itemsConValor(field.value)}
            value={field.value ?? null}
            onValueChange={field.onChange}
            disabled={disabled}
            name={field.name}
          >
            <SelectTrigger
              // RHF enfoca el campo por este ref (primer error al guardar):
              // el botón visible, no el input oculto del Select.
              ref={field.ref}
              id={idCampo}
              className={cn("w-full", MARGEN_DESPLAZAMIENTO_CAMPO, className)}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-required={obligatorio || undefined}
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
