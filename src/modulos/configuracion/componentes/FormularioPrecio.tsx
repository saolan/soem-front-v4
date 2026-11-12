import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { BarraAccionesFormulario } from "@/compartido/componentes/BarraAccionesFormulario"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { CampoInterruptor } from "@/compartido/componentes/CampoInterruptor"
import { CampoSeleccion } from "@/compartido/componentes/CampoSeleccion"
import {
  GrillaCampos,
  SeccionFormulario,
} from "@/compartido/componentes/SeccionFormulario"
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

const AYUDA_ALCANCE_ALTA =
  "TODOS habilita la lista en todas las sucursales activas y crea el precio en cero de cada producto activo. No se puede cambiar después."
const AYUDA_ALCANCE_EDICION = "El alcance se fija al crear la lista."

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
  const { isDirty, isSubmitting } = formulario.formState

  useEffect(() => {
    onCambiosPendientes?.(isDirty)
  }, [isDirty, onCambiosPendientes])

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
          <GrillaCampos>
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
            <CampoSeleccion
              control={control}
              name="alcanc"
              etiqueta="Alcance"
              descripcion={
                soloLectura
                  ? undefined
                  : esAlta
                    ? AYUDA_ALCANCE_ALTA
                    : AYUDA_ALCANCE_EDICION
              }
              opciones={OPCIONES_ALCANCE}
              // Inmutable: el PUT lo ignora.
              disabled={!esAlta}
              obligatorio={esAlta && !soloLectura}
            />
          </GrillaCampos>
          {/* El alta crea la lista activa por defecto. */}
          {!esAlta && (
            <GrillaCampos>
              <CampoInterruptor
                control={control}
                name="estado"
                etiqueta="Activa"
                disabled={!puedeCambiarEstado}
                descripcion={
                  puedeCambiarEstado || soloLectura
                    ? undefined
                    : "Requiere permiso para eliminar."
                }
              />
            </GrillaCampos>
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
