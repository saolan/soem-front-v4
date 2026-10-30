import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { BarraAccionesFormulario } from "@/compartido/componentes/BarraAccionesFormulario"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { CampoInterruptor } from "@/compartido/componentes/CampoInterruptor"
import {
  GrillaCampos,
  SeccionFormulario,
} from "@/compartido/componentes/SeccionFormulario"
import { Button } from "@/compartido/componentes/ui/button"
import {
  CAMPOS_SUCURSAL,
  esquemaSucursalFormulario,
  LONGITUDES_SUCURSAL,
  type SucursalFormulario,
} from "@/modulos/configuracion/esquemas/sucursal"

interface PropsFormularioSucursal {
  valoresIniciales: SucursalFormulario
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
  onGuardar: (valores: SucursalFormulario) => Promise<boolean | void>
  onCancelar: () => void
  /** Informa si hay cambios sin guardar (aviso al salir de la página). */
  onCambiosPendientes?: (hayCambios: boolean) => void
}

/** Datos generales de la sucursal (SucursalDTO). */
export function FormularioSucursal({
  valoresIniciales,
  esAlta,
  soloLectura,
  puedeCambiarEstado = false,
  textoGuardar,
  onGuardar,
  onCancelar,
  onCambiosPendientes,
}: PropsFormularioSucursal) {
  const [aviso, setAviso] = useState<string | null>(null)
  const formulario = useForm<SucursalFormulario>({
    resolver: zodResolver(esquemaSucursalFormulario),
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
        aplicarErroresFormulario(error, formulario.setError, CAMPOS_SUCURSAL)
      )
    }
  })

  return (
    // Datos de la sucursal, no del usuario: sin autocompletado del navegador.
    <form
      onSubmit={enviar}
      noValidate
      autoComplete="off"
      className="flex flex-col gap-6"
    >
      <AvisoError mensaje={aviso} />
      <fieldset disabled={soloLectura} className="flex flex-col gap-6">
        <SeccionFormulario titulo="Identificación">
          <GrillaCampos>
            <CampoFormulario
              control={control}
              name="codigo"
              maxLength={LONGITUDES_SUCURSAL.codigo}
              etiqueta="Código"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="descri"
              maxLength={LONGITUDES_SUCURSAL.descri}
              etiqueta="Descripción"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="ruc"
              maxLength={LONGITUDES_SUCURSAL.ruc}
              etiqueta="RUC"
              obligatorio={!soloLectura}
              inputMode="numeric"
            />
            <CampoFormulario
              control={control}
              name="razonSoci"
              maxLength={LONGITUDES_SUCURSAL.razonSoci}
              etiqueta="Razón social"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="nombreCome"
              maxLength={LONGITUDES_SUCURSAL.nombreCome}
              etiqueta="Nombre comercial"
            />
            <CampoFormulario
              control={control}
              name="logoti"
              maxLength={LONGITUDES_SUCURSAL.logoti}
              etiqueta="Ruta del logotipo"
            />
          </GrillaCampos>
          <GrillaCampos>
            <CampoInterruptor
              control={control}
              name="matriz"
              etiqueta="Matriz"
            />
            {/* El alta siempre crea la sucursal activa (POST). */}
            {!esAlta && (
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
            )}
          </GrillaCampos>
        </SeccionFormulario>

        <SeccionFormulario titulo="Ubicación y contacto">
          <GrillaCampos>
            <CampoFormulario
              control={control}
              name="ciudad"
              maxLength={LONGITUDES_SUCURSAL.ciudad}
              etiqueta="Ciudad"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="direcc"
              maxLength={LONGITUDES_SUCURSAL.direcc}
              etiqueta="Dirección"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="direccEsta"
              maxLength={LONGITUDES_SUCURSAL.direccEsta}
              etiqueta="Dirección del establecimiento"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="correo"
              maxLength={LONGITUDES_SUCURSAL.correo}
              etiqueta="Correo"
              obligatorio={!soloLectura}
              type="email"
            />
            <CampoFormulario
              control={control}
              name="telef1"
              maxLength={LONGITUDES_SUCURSAL.telef1}
              etiqueta="Teléfono principal"
              obligatorio={!soloLectura}
              type="tel"
            />
            <CampoFormulario
              control={control}
              name="telef2"
              maxLength={LONGITUDES_SUCURSAL.telef2}
              etiqueta="Teléfono secundario"
              type="tel"
            />
          </GrillaCampos>
        </SeccionFormulario>

        <SeccionFormulario titulo="Representante legal">
          <GrillaCampos>
            <CampoFormulario
              control={control}
              name="repres"
              maxLength={LONGITUDES_SUCURSAL.repres}
              etiqueta="Nombre del representante"
              obligatorio={!soloLectura}
            />
            <CampoFormulario
              control={control}
              name="represCedu"
              maxLength={LONGITUDES_SUCURSAL.represCedu}
              etiqueta="Cédula del representante"
              obligatorio={!soloLectura}
              inputMode="numeric"
            />
            <CampoFormulario
              control={control}
              name="represDire"
              maxLength={LONGITUDES_SUCURSAL.represDire}
              etiqueta="Dirección del representante"
              obligatorio={!soloLectura}
            />
          </GrillaCampos>
        </SeccionFormulario>

        <SeccionFormulario titulo="Información tributaria">
          <GrillaCampos>
            <CampoFormulario
              control={control}
              name="rucCont"
              maxLength={LONGITUDES_SUCURSAL.rucCont}
              etiqueta="RUC contable"
              obligatorio={!soloLectura}
              inputMode="numeric"
            />
            <CampoFormulario
              control={control}
              name="contriEspe"
              maxLength={LONGITUDES_SUCURSAL.contriEspe}
              etiqueta="Contribuyente especial"
            />
            <CampoInterruptor
              control={control}
              name="obligaCont"
              etiqueta="Obligado a llevar contabilidad"
              alinearConCampos
            />
          </GrillaCampos>
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
