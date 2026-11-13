import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { TriangleAlertIcon } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { BarraAccionesFormulario } from "@/compartido/componentes/BarraAccionesFormulario"
import { CampoEstado } from "@/compartido/componentes/CampoEstado"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { CampoOpcionesTarjeta } from "@/compartido/componentes/CampoOpcionesTarjeta"
import {
  GrillaCampos,
  SeccionFormulario,
} from "@/compartido/componentes/SeccionFormulario"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import {
  CAMPOS_PRECIO,
  esquemaPrecioFormulario,
  LONGITUDES_PRECIO,
  OPCIONES_ALCANCE,
  type PrecioFormulario,
} from "@/modulos/configuracion/esquemas/precio"

interface PropsFormularioPrecio {
  valoresIniciales: PrecioFormulario
  /** En el alta se puede enviar sin cambios (para ver las validaciones). */
  esAlta: boolean
  /** Sin permiso de crear o modificar el formulario es de solo lectura. */
  soloLectura: boolean
  /**
   * Desactivar es un borrado lógico: el estado solo lo cambia quien tiene
   * permiso para eliminar.
   */
  puedeCambiarEstado?: boolean
  textoGuardar: string
  /**
   * Debe lanzar el error del API para reflejarlo en los campos. Si devuelve
   * `false` (p. ej. se canceló una confirmación) los cambios se conservan.
   */
  onGuardar: (valores: PrecioFormulario) => Promise<boolean | void>
  onCancelar: () => void
  /** Informa si hay cambios sin guardar (aviso al salir de la página). */
  onCambiosPendientes?: (hayCambios: boolean) => void
}

const AYUDA_ALCANCE_ALTA = "No se puede cambiar después de crear la lista."
const AYUDA_ALCANCE_EDICION = "El alcance se fija al crear la lista."
// La descripción de la tarjeta ya explica qué se genera: el aviso destaca
// lo que no se puede deshacer.
const AVISO_ALCANCE_TODOS = {
  titulo: "Esta elección no se puede deshacer",
  descripcion:
    "Los precios en cero de todos los productos activos se crean al guardar la lista y el alcance no se puede cambiar después.",
}

/** Datos de una lista de precio (PrecioDTO). */
export function FormularioPrecio({
  valoresIniciales,
  esAlta,
  soloLectura,
  puedeCambiarEstado = false,
  textoGuardar,
  onGuardar,
  onCancelar,
  onCambiosPendientes,
}: PropsFormularioPrecio) {
  const [aviso, setAviso] = useState<string | null>(null)
  const formulario = useForm<PrecioFormulario>({
    resolver: zodResolver(esquemaPrecioFormulario),
    defaultValues: valoresIniciales,
  })
  const { control } = formulario
  const alcanc = useWatch({ control, name: "alcanc" })
  const { isDirty, isSubmitting } = formulario.formState

  useEffect(() => {
    onCambiosPendientes?.(isDirty)
  }, [isDirty, onCambiosPendientes])

  // Al abrir el alta o la edición se escribe directo en el primer campo, sin
  // tener que hacer clic. En consulta (sin permiso) no hay nada que editar.
  useEffect(() => {
    if (!soloLectura) {
      formulario.setFocus("codigo")
    }
  }, [formulario, soloLectura])

  const enviar = formulario.handleSubmit(async (valores) => {
    setAviso(null)
    try {
      if ((await onGuardar(valores)) !== false) {
        formulario.reset(valores)
      }
    } catch (error) {
      setAviso(
        aplicarErroresFormulario(error, formulario.setError, CAMPOS_PRECIO)
      )
    }
  })

  return (
    <form
      onSubmit={enviar}
      noValidate
      autoComplete="off"
      className="flex flex-col gap-6"
    >
      <AvisoError mensaje={aviso} enfocar />
      <fieldset disabled={soloLectura} className="flex flex-col gap-6">
        <SeccionFormulario titulo="Datos de la lista">
          {/* Pocos campos: 2 columnas también en xl, para que no quede uno
              suelto en la segunda fila. */}
          <GrillaCampos className="xl:grid-cols-2">
            <CampoFormulario
              control={control}
              name="codigo"
              maxLength={LONGITUDES_PRECIO.codigo}
              etiqueta="Código"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="descri"
              maxLength={LONGITUDES_PRECIO.descri}
              etiqueta="Descripción"
              obligatorio={!soloLectura}
            />
            {/* BigDecimal: se edita como texto, sin convertir a número. */}
            <CampoFormulario
              control={control}
              name="factor"
              maxLength={LONGITUDES_PRECIO.factor}
              etiqueta="Factor"
              descripcion="Unidades que representa la lista (ej. Unidad = 1, Docena = 12)."
              obligatorio={!soloLectura}
              inputMode="decimal"
              className="tabular-nums"
            />
            {/* El alta crea el registro en estado Activo. */}
            {!esAlta && (
              <CampoEstado
                control={control}
                name="estado"
                puedeCambiar={puedeCambiarEstado}
                soloLectura={soloLectura}
                // Comparte fila con Factor (etiqueta, input y ayuda).
                etiquetaArriba
              />
            )}
          </GrillaCampos>
          {/* Tarjetas a lo ancho: cada opción explica su efecto. Inmutable
              al editar (el PUT lo ignora): solo se muestra la elegida. */}
          <CampoOpcionesTarjeta
            control={control}
            name="alcanc"
            etiqueta="Alcance"
            opciones={OPCIONES_ALCANCE}
            descripcion={
              soloLectura
                ? undefined
                : esAlta
                  ? AYUDA_ALCANCE_ALTA
                  : AYUDA_ALCANCE_EDICION
            }
            obligatorio={esAlta && !soloLectura}
            soloSeleccionada={!esAlta}
          />
          {/* Efecto irreversible: se destaca solo cuando se elige TODOS. */}
          {esAlta && alcanc === "TODOS" && (
            <Alert className="border-ambar">
              <TriangleAlertIcon aria-hidden="true" className="text-ambar" />
              <AlertTitle>{AVISO_ALCANCE_TODOS.titulo}</AlertTitle>
              <AlertDescription>
                {AVISO_ALCANCE_TODOS.descripcion}
              </AlertDescription>
            </Alert>
          )}
        </SeccionFormulario>
      </fieldset>

      {soloLectura ? (
        <div>
          <Button type="button" variant="outline" onClick={onCancelar}>
            Volver
          </Button>
        </div>
      ) : (
        <BarraAccionesFormulario pendiente={isDirty}>
          <Button type="button" variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || (!esAlta && !isDirty)}
          >
            {isSubmitting ? "Guardando…" : textoGuardar}
          </Button>
        </BarraAccionesFormulario>
      )}
    </form>
  )
}
