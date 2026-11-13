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
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/compartido/componentes/ui/field"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/compartido/componentes/ui/radio-group"

/** Opción de un dominio cerrado con su consecuencia explicada. */
export interface OpcionTarjeta {
  /** Valor que viaja al API (ej. un enum en MAYÚSCULAS). */
  valor: string
  titulo: string
  descripcion: string
}

interface PropsCampoOpcionesTarjeta<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  etiqueta: string
  opciones: readonly OpcionTarjeta[]
  /** Texto de ayuda bajo las opciones. */
  descripcion?: string
  obligatorio?: boolean
  /**
   * Valor fijo (ej. inmutable al editar): se muestra solo la opción elegida,
   * deshabilitada, para que se lea su descripción.
   */
  soloSeleccionada?: boolean
}

/**
 * Opción única presentada como tarjetas (título y descripción). Para
 * dominios cortos cuyas opciones tienen efectos que conviene leer antes de
 * elegir; con muchas opciones usa `CampoSeleccion`.
 */
export function CampoOpcionesTarjeta<T extends FieldValues>({
  control,
  name,
  etiqueta,
  opciones,
  descripcion,
  obligatorio = false,
  soloSeleccionada = false,
}: PropsCampoOpcionesTarjeta<T>) {
  const id = useId()
  const idDescripcion = `${id}-descripcion`
  const idError = `${id}-error`

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const visibles = soloSeleccionada
          ? opciones.filter(({ valor }) => valor === field.value)
          : opciones
        return (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend
              id={`${id}-etiqueta`}
              variant="label"
              className="flex gap-1"
            >
              {etiqueta}
              {obligatorio && (
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              )}
            </FieldLegend>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              inputRef={field.ref}
              disabled={soloSeleccionada}
              aria-labelledby={`${id}-etiqueta`}
              aria-required={obligatorio || undefined}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                [descripcion && idDescripcion, fieldState.error && idError]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              className="grid gap-3 sm:grid-cols-2"
            >
              {visibles.map((opcion) => {
                const idOpcion = `${id}-${opcion.valor}`
                return (
                  <FieldLabel key={opcion.valor} htmlFor={idOpcion}>
                    <Field orientation="horizontal">
                      {/* Nombre accesible: el título; la descripción se
                          anuncia aparte. */}
                      <RadioGroupItem
                        id={idOpcion}
                        value={opcion.valor}
                        aria-labelledby={`${idOpcion}-titulo`}
                        aria-describedby={`${idOpcion}-descripcion`}
                      />
                      <FieldContent>
                        <FieldTitle id={`${idOpcion}-titulo`}>
                          {opcion.titulo}
                        </FieldTitle>
                        <FieldDescription id={`${idOpcion}-descripcion`}>
                          {opcion.descripcion}
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                )
              })}
            </RadioGroup>
            {descripcion && (
              <FieldDescription id={idDescripcion}>
                {descripcion}
              </FieldDescription>
            )}
            {fieldState.error && (
              <FieldError id={idError} errors={[fieldState.error]} />
            )}
          </FieldSet>
        )
      }}
    />
  )
}
