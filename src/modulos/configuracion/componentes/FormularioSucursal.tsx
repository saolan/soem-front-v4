import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { CampoInterruptor } from "@/compartido/componentes/CampoInterruptor"
import { Button } from "@/compartido/componentes/ui/button"
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/compartido/componentes/ui/field"
import {
  CAMPOS_SUCURSAL,
  esquemaSucursalFormulario,
  type SucursalFormulario,
} from "@/modulos/configuracion/esquemas/sucursal"

interface PropsFormularioSucursal {
  valoresIniciales: SucursalFormulario
  /** Sin permiso de crear o modificar el formulario es de solo lectura. */
  soloLectura: boolean
  textoGuardar: string
  /** Debe lanzar el error del API para reflejarlo en los campos. */
  onGuardar: (valores: SucursalFormulario) => Promise<void>
  onCancelar: () => void
}

const claseGrilla = "grid gap-4 sm:grid-cols-2"

/** Datos generales de la sucursal (SucursalDTO). */
export function FormularioSucursal({
  valoresIniciales,
  soloLectura,
  textoGuardar,
  onGuardar,
  onCancelar,
}: PropsFormularioSucursal) {
  const [aviso, setAviso] = useState<string | null>(null)
  const formulario = useForm<SucursalFormulario>({
    resolver: zodResolver(esquemaSucursalFormulario),
    defaultValues: valoresIniciales,
  })
  const { control } = formulario
  const esMatriz = useWatch({ control, name: "matriz" })

  const enviar = formulario.handleSubmit(async (valores) => {
    setAviso(null)
    try {
      await onGuardar(valores)
      formulario.reset(valores)
    } catch (error) {
      setAviso(
        aplicarErroresFormulario(error, formulario.setError, CAMPOS_SUCURSAL)
      )
    }
  })

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <AvisoError mensaje={aviso} />
      <fieldset disabled={soloLectura} className="flex flex-col gap-8">
        <FieldSet>
          <FieldLegend>Identificación</FieldLegend>
          <FieldGroup className={claseGrilla}>
            <CampoFormulario
              control={control}
              name="codigo"
              etiqueta="Código"
            />
            <CampoFormulario
              control={control}
              name="descri"
              etiqueta="Descripción"
            />
            <CampoFormulario
              control={control}
              name="ruc"
              etiqueta="RUC"
              inputMode="numeric"
            />
            <CampoFormulario
              control={control}
              name="razonSoci"
              etiqueta="Razón social"
            />
            <CampoFormulario
              control={control}
              name="nombreCome"
              etiqueta="Nombre comercial (opcional)"
            />
            <CampoFormulario
              control={control}
              name="logoti"
              etiqueta="Ruta del logotipo (opcional)"
            />
          </FieldGroup>
          <FieldGroup className={claseGrilla}>
            <CampoInterruptor
              control={control}
              name="matriz"
              etiqueta="Matriz"
              descripcion={
                esMatriz && !valoresIniciales.matriz
                  ? "Al guardar, la sucursal matriz actual dejará de serlo."
                  : "Solo puede existir una sucursal matriz."
              }
            />
            <CampoInterruptor
              control={control}
              name="estado"
              etiqueta="Activa"
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Ubicación y contacto</FieldLegend>
          <FieldGroup className={claseGrilla}>
            <CampoFormulario
              control={control}
              name="ciudad"
              etiqueta="Ciudad"
            />
            <CampoFormulario
              control={control}
              name="direcc"
              etiqueta="Dirección"
            />
            <CampoFormulario
              control={control}
              name="direccEsta"
              etiqueta="Dirección del establecimiento"
            />
            <CampoFormulario
              control={control}
              name="correo"
              etiqueta="Correo"
              type="email"
              autoComplete="email"
            />
            <CampoFormulario
              control={control}
              name="telef1"
              etiqueta="Teléfono principal"
              type="tel"
            />
            <CampoFormulario
              control={control}
              name="telef2"
              etiqueta="Teléfono secundario (opcional)"
              type="tel"
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Representante legal</FieldLegend>
          <FieldGroup className={claseGrilla}>
            <CampoFormulario
              control={control}
              name="repres"
              etiqueta="Representante legal"
            />
            <CampoFormulario
              control={control}
              name="represCedu"
              etiqueta="Cédula del representante"
              inputMode="numeric"
            />
            <CampoFormulario
              control={control}
              name="represDire"
              etiqueta="Dirección del representante"
            />
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Información tributaria</FieldLegend>
          <FieldGroup className={claseGrilla}>
            <CampoFormulario
              control={control}
              name="rucCont"
              etiqueta="RUC contable"
              inputMode="numeric"
            />
            <CampoFormulario
              control={control}
              name="contriEspe"
              etiqueta="Contribuyente especial (opcional)"
            />
            <CampoInterruptor
              control={control}
              name="obligaCont"
              etiqueta="Obligado a llevar contabilidad"
            />
          </FieldGroup>
        </FieldSet>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        {!soloLectura && (
          <Button type="submit" disabled={formulario.formState.isSubmitting}>
            {formulario.formState.isSubmitting ? "Guardando…" : textoGuardar}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancelar}>
          {soloLectura ? "Volver" : "Cancelar"}
        </Button>
      </div>
    </form>
  )
}
