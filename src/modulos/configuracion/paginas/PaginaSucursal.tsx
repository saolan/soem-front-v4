import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { mensajeDeError } from "@/compartido/api/errores"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { DialogoCambiosSinGuardar } from "@/compartido/componentes/DialogoCambiosSinGuardar"
import { DialogoConfirmacion } from "@/compartido/componentes/DialogoConfirmacion"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { useAvisoCambiosSinGuardar } from "@/compartido/hooks/useAvisoCambiosSinGuardar"
import { useRutaRetorno } from "@/compartido/hooks/useRutaRetorno"
import { useTienePermiso } from "@/compartido/sesion/useTienePermiso"
import {
  useActivarSucursal,
  useCrearSucursal,
  useEliminarSucursal,
  useModificarSucursal,
  useSucursal,
} from "@/modulos/configuracion/api/sucursales"
import {
  RECURSO_CONFIGURACION,
  RUTA_SUCURSALES,
  rutaSucursal,
} from "@/modulos/configuracion/constantes"
import { EncabezadoSucursal } from "@/modulos/configuracion/componentes/EncabezadoSucursal"
import { FormularioCertificado } from "@/modulos/configuracion/componentes/FormularioCertificado"
import { FormularioSucursal } from "@/modulos/configuracion/componentes/FormularioSucursal"
import {
  aFormularioSucursal,
  valoresSucursalNueva,
  type SucursalFormulario,
} from "@/modulos/configuracion/esquemas/sucursal"

/** Alta de una sucursal. Al crearla se pasa a su edición (certificado). */
export function PaginaNuevaSucursal() {
  const navegar = useNavigate()
  const listado = useRutaRetorno(RUTA_SUCURSALES)
  const crear = useCrearSucursal()
  const puedeCrear = useTienePermiso(RECURSO_CONFIGURACION, "crear")
  const [cambiosSucursal, setCambiosSucursal] = useState(false)
  const salida = useAvisoCambiosSinGuardar({ sucursal: cambiosSucursal })

  // La edición conserva el retorno al listado.
  const guardar = (valores: SucursalFormulario) =>
    salida.sinAviso("sucursal", async () => {
      const { datos, mensaje } = await crear.mutateAsync(valores)
      toast.success(mensaje)
      void navegar(rutaSucursal(datos.sucursalId), {
        replace: true,
        state: listado.estado,
      })
    })

  return (
    <section className="flex flex-col gap-6">
      <EncabezadoSucursal rutaListado={listado.ruta} />
      {puedeCrear ? (
        <FormularioSucursal
          valoresIniciales={valoresSucursalNueva}
          esAlta
          soloLectura={false}
          textoGuardar="Crear sucursal"
          onGuardar={guardar}
          onCancelar={() => void navegar(listado.ruta)}
          onCambiosPendientes={setCambiosSucursal}
        />
      ) : (
        <AvisoError mensaje="No tiene permiso para crear sucursales." />
      )}
      <DialogoCambiosSinGuardar salida={salida} />
    </section>
  )
}

/** Esqueleto con la forma de la pantalla de edición. */
function CargandoSucursal() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">Cargando sucursal…</span>
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-8 w-72" />
      {Array.from({ length: 2 }, (_, i) => (
        <Skeleton key={i} className="h-64 w-full rounded-xl" />
      ))}
    </div>
  )
}

function EdicionSucursal({
  sucursalId,
  rutaListado,
}: {
  sucursalId: number
  rutaListado: string
}) {
  const navegar = useNavigate()
  const sucursal = useSucursal(sucursalId)
  const modificar = useModificarSucursal(sucursalId)
  const activar = useActivarSucursal()
  const eliminar = useEliminarSucursal()
  const puedeModificar = useTienePermiso(RECURSO_CONFIGURACION, "modificar")
  const puedeEliminar = useTienePermiso(RECURSO_CONFIGURACION, "eliminar")
  // Confirmación de la desactivación: guarda el `resolve` de la promesa que
  // espera `guardar` hasta que el usuario responde.
  const [respuestaConfirmacion, setRespuestaConfirmacion] = useState<
    ((confirmada: boolean) => void) | null
  >(null)
  const confirmarDesactivacion = () =>
    new Promise<boolean>((resolve) => setRespuestaConfirmacion(() => resolve))
  const responderConfirmacion = (confirmada: boolean) => {
    respuestaConfirmacion?.(confirmada)
    setRespuestaConfirmacion(null)
  }
  const [cambiosSucursal, setCambiosSucursal] = useState(false)
  const [cambiosCertificado, setCambiosCertificado] = useState(false)
  const salida = useAvisoCambiosSinGuardar({
    sucursal: cambiosSucursal,
    certificado: cambiosCertificado,
  })

  if (sucursal.isPending) {
    return <CargandoSucursal />
  }
  if (sucursal.isError) {
    return (
      <>
        <EncabezadoSucursal rutaListado={rutaListado} titulo="Sucursal" />
        <AvisoError mensaje={mensajeDeError(sucursal.error)} />
      </>
    )
  }

  const estadoActual = sucursal.data.estado

  // El PUT ignora el estado: si el interruptor cambió se aplica después con
  // DELETE (desactivar, previa confirmación) o PUT /activar. Vuelve al
  // listado; si el certificado tiene cambios sin guardar, se avisa.
  const guardar = (valores: SucursalFormulario) =>
    salida.sinAviso("sucursal", async () => {
      const desactiva = estadoActual && !valores.estado
      if (desactiva && !(await confirmarDesactivacion())) {
        return false
      }
      const { mensaje } = await modificar.mutateAsync(valores)
      toast.success(mensaje)
      if (valores.estado !== estadoActual) {
        const respuesta = valores.estado
          ? await activar.mutateAsync(sucursalId)
          : await eliminar.mutateAsync(sucursalId)
        toast.success(respuesta.mensaje)
      }
      void navegar(rutaListado)
      return true
    })

  // El certificado ya está guardado (su `reset` aún no se refleja en
  // `cambiosCertificado`); si la sucursal tiene cambios, se avisa. El bloqueo
  // se evalúa al iniciar la navegación, por eso no se espera.
  const volverTrasCertificado = () =>
    void salida.sinAviso("certificado", async () => {
      void navegar(rutaListado)
    })

  return (
    <>
      <EncabezadoSucursal
        rutaListado={rutaListado}
        sucursal={sucursal.data}
        puedeEliminar={puedeEliminar}
      />
      <FormularioSucursal
        valoresIniciales={aFormularioSucursal(sucursal.data)}
        esAlta={false}
        soloLectura={!puedeModificar}
        puedeCambiarEstado={puedeEliminar}
        textoGuardar="Guardar cambios"
        onGuardar={guardar}
        onCancelar={() => void navegar(rutaListado)}
        onCambiosPendientes={setCambiosSucursal}
      />
      <FormularioCertificado
        sucursalId={sucursalId}
        puedeModificar={puedeModificar}
        puedeEliminar={puedeEliminar}
        onCambiosPendientes={setCambiosCertificado}
        onGuardado={volverTrasCertificado}
      />
      <DialogoCambiosSinGuardar salida={salida} />
      <DialogoConfirmacion
        abierto={respuestaConfirmacion !== null}
        onAbiertoChange={(abierto) => {
          if (!abierto) {
            responderConfirmacion(false)
          }
        }}
        titulo="Desactivar sucursal"
        descripcion={
          <>
            La sucursal <strong>{sucursal.data.descri}</strong> quedará
            inactiva. ¿Desea continuar?
          </>
        }
        textoConfirmar="Desactivar"
        onConfirmar={() => responderConfirmacion(true)}
      />
    </>
  )
}

/** Edición (o consulta sin permiso de modificar) de una sucursal. */
export function PaginaSucursal() {
  const { sucursalId } = useParams()
  const listado = useRutaRetorno(RUTA_SUCURSALES)
  const id = sucursalId && /^\d+$/.test(sucursalId) ? Number(sucursalId) : null

  return (
    <section className="flex flex-col gap-6">
      {id === null ? (
        <>
          <EncabezadoSucursal rutaListado={listado.ruta} titulo="Sucursal" />
          <AvisoError mensaje="El recurso solicitado no existe" />
        </>
      ) : (
        <EdicionSucursal key={id} sucursalId={id} rutaListado={listado.ruta} />
      )}
    </section>
  )
}
