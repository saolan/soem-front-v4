import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { mensajeDeError } from "@/compartido/api/errores"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CampoFormulario } from "@/compartido/componentes/CampoFormulario"
import { CampoSeleccion } from "@/compartido/componentes/CampoSeleccion"
import { DialogoConfirmacion } from "@/compartido/componentes/DialogoConfirmacion"
import { Button } from "@/compartido/componentes/ui/button"
import { FieldGroup } from "@/compartido/componentes/ui/field"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  useCertificadoSucursal,
  useComboCertificadosEmisor,
  useEliminarCertificado,
  useGuardarCertificado,
} from "@/modulos/configuracion/api/sucursales"
import {
  CAMPOS_CERTIFICADO,
  esquemaCertificadoFormulario,
  type CertificadoFormulario,
  type CertificadoValidado,
  type SucuCertEmisDTO,
} from "@/modulos/configuracion/esquemas/certificadoSucursal"

// SucursalServicio#guardarCertificadoEmisor devuelve el error de la clave
// como "certificadoEmisor.clave" (Bean Validation usa "clave").
const ALIAS_ERRORES = { "certificadoEmisor.clave": "clave" } as const

interface PropsCertificado {
  sucursalId: number
  puedeModificar: boolean
  puedeEliminar: boolean
}

function Formulario({
  sucursalId,
  certificado,
  puedeModificar,
  puedeEliminar,
}: PropsCertificado & { certificado: SucuCertEmisDTO | null }) {
  const existe = certificado !== null
  const emisores = useComboCertificadosEmisor()
  const guardar = useGuardarCertificado(sucursalId)
  const eliminar = useEliminarCertificado(sucursalId)
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const formulario = useForm<
    CertificadoFormulario,
    unknown,
    CertificadoValidado
  >({
    resolver: zodResolver(esquemaCertificadoFormulario(existe)),
    defaultValues: {
      certEmisId: certificado?.certEmisId ?? null,
      ruta: certificado?.ruta ?? "",
      descri: certificado?.descri ?? "",
      clave: "",
    },
  })
  const { control } = formulario

  const enviar = formulario.handleSubmit(async (valores) => {
    setAviso(null)
    try {
      const { mensaje } = await guardar.mutateAsync(valores)
      toast.success(mensaje)
    } catch (error) {
      setAviso(
        aplicarErroresFormulario(
          error,
          formulario.setError,
          CAMPOS_CERTIFICADO,
          ALIAS_ERRORES
        )
      )
    }
  })

  const quitar = () =>
    eliminar.mutate(undefined, {
      onSuccess: ({ mensaje }) => {
        setConfirmando(false)
        toast.success(mensaje)
      },
      onError: (error) => {
        setConfirmando(false)
        toast.error(mensajeDeError(error))
      },
    })

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      {!existe && (
        <p className="text-sm text-muted-foreground">
          La sucursal aún no tiene un certificado de firma electrónica.
        </p>
      )}
      <AvisoError mensaje={aviso} />
      <AvisoError
        mensaje={emisores.isError ? mensajeDeError(emisores.error) : null}
      />
      <fieldset disabled={!puedeModificar}>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <CampoSeleccion
            control={control}
            name="certEmisId"
            etiqueta="Emisor del certificado"
            opciones={emisores.data ?? []}
            disabled={!puedeModificar || emisores.isPending}
          />
          <CampoFormulario
            control={control}
            name="descri"
            etiqueta="Descripción del certificado"
          />
          <CampoFormulario
            control={control}
            name="ruta"
            etiqueta="Ruta del archivo del certificado"
          />
          <CampoFormulario
            control={control}
            name="clave"
            etiqueta="Clave del certificado"
            type="password"
            autoComplete="new-password"
            descripcion={
              existe
                ? "Déjela vacía para conservar la clave actual."
                : undefined
            }
          />
        </FieldGroup>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        {puedeModificar && (
          <Button type="submit" disabled={guardar.isPending}>
            {guardar.isPending ? "Guardando…" : "Guardar certificado"}
          </Button>
        )}
        {existe && puedeEliminar && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmando(true)}
          >
            Quitar certificado
          </Button>
        )}
      </div>
      <DialogoConfirmacion
        abierto={confirmando}
        onAbiertoChange={setConfirmando}
        titulo="Quitar certificado"
        descripcion="La sucursal quedará sin certificado de firma electrónica. ¿Desea continuar?"
        textoConfirmar="Quitar"
        pendiente={eliminar.isPending}
        onConfirmar={quitar}
      />
    </form>
  )
}

/** Certificado de firma electrónica de la sucursal (sub-recurso). */
export function FormularioCertificado(props: PropsCertificado) {
  const certificado = useCertificadoSucursal(props.sucursalId)

  if (certificado.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">Cargando certificado…</span>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  }
  if (certificado.isError) {
    return (
      <div className="flex flex-col items-start gap-3">
        <AvisoError mensaje={mensajeDeError(certificado.error)} />
        <Button variant="outline" onClick={() => void certificado.refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }
  // Se monta de nuevo al crear o quitar el certificado (cambia la regla de
  // la clave y los valores iniciales).
  return (
    <Formulario
      key={certificado.data ? "con" : "sin"}
      {...props}
      certificado={certificado.data}
    />
  )
}
