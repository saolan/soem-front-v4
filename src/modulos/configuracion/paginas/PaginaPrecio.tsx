import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { detalleDeError, mensajeDeError } from "@/compartido/api/errores"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { DialogoCambiosSinGuardar } from "@/compartido/componentes/DialogoCambiosSinGuardar"
import { DialogoConfirmacion } from "@/compartido/componentes/DialogoConfirmacion"
import { EncabezadoDetalle } from "@/compartido/componentes/EncabezadoDetalle"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { useAvisoCambiosSinGuardar } from "@/compartido/hooks/useAvisoCambiosSinGuardar"
import { useRutaRetorno } from "@/compartido/hooks/useRutaRetorno"
import { useTienePermiso } from "@/compartido/sesion/useTienePermiso"
import {
  useActivarPrecio,
  useCrearPrecio,
  useEliminarPrecio,
  useModificarPrecio,
  usePrecio,
} from "@/modulos/configuracion/api/precios"
import {
  RECURSO_CONFIGURACION,
  RUTA_PRECIOS,
} from "@/modulos/configuracion/constantes"
import { FormularioPrecio } from "@/modulos/configuracion/componentes/FormularioPrecio"
import {
  aFormularioPrecio,
  valoresPrecioNuevo,
  type PrecioFormulario,
} from "@/modulos/configuracion/esquemas/precio"

// Qué se perdería al salir con cambios sin guardar (aviso de salida).
const DATOS_PRECIO = "los datos de la lista de precio"

// Migas de pan de las pantallas de una lista de precio.
const MIGAS = { modulo: "Configuración", etiquetaListado: "Listas de precio" }

/** Alta de una lista de precio. Al crearla se vuelve al listado. */
export function PaginaNuevoPrecio() {
  const navegar = useNavigate()
  const listado = useRutaRetorno(RUTA_PRECIOS)
  const crear = useCrearPrecio()
  const puedeCrear = useTienePermiso(RECURSO_CONFIGURACION, "crear")
  const [cambios, setCambios] = useState(false)
  const salida = useAvisoCambiosSinGuardar({
    precio: { pendiente: cambios, descripcion: DATOS_PRECIO },
  })

  const guardar = (valores: PrecioFormulario) =>
    salida.sinAviso("precio", async () => {
      const { mensaje } = await crear.mutateAsync(valores)
      toast.success(mensaje)
      void navegar(listado.ruta)
    })

  return (
    <section className="flex flex-col gap-6">
      <EncabezadoDetalle
        {...MIGAS}
        rutaListado={listado.ruta}
        titulo="Nueva lista de precio"
      />
      {puedeCrear ? (
        <FormularioPrecio
          valoresIniciales={valoresPrecioNuevo}
          esAlta
          soloLectura={false}
          textoGuardar="Crear precio"
          onGuardar={guardar}
          onCancelar={() => void navegar(listado.ruta)}
          onCambiosPendientes={setCambios}
        />
      ) : (
        <AvisoError mensaje="No tiene permiso para crear listas de precio." />
      )}
      <DialogoCambiosSinGuardar salida={salida} />
    </section>
  )
}

/** Esqueleto con la forma de la pantalla de edición. */
function CargandoPrecio() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">Cargando lista de precio…</span>
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

function EdicionPrecio({
  precioId,
  rutaListado,
}: {
  precioId: number
  rutaListado: string
}) {
  const navegar = useNavigate()
  const precio = usePrecio(precioId)
  const modificar = useModificarPrecio(precioId)
  const eliminar = useEliminarPrecio()
  const activar = useActivarPrecio()
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
  const [cambios, setCambios] = useState(false)
  const salida = useAvisoCambiosSinGuardar({
    precio: { pendiente: cambios, descripcion: DATOS_PRECIO },
  })

  if (precio.isPending) {
    return <CargandoPrecio />
  }
  if (precio.isError) {
    return (
      <>
        <EncabezadoDetalle
          {...MIGAS}
          rutaListado={rutaListado}
          titulo="Lista de precio"
        />
        <AvisoError mensaje={mensajeDeError(precio.error)} />
      </>
    )
  }

  const estadoActual = precio.data.estado

  // El PUT ignora el estado: si el interruptor cambió se aplica después con
  // DELETE (desactivar, previa confirmación) o PUT /activar, que quitan o
  // restablecen el acceso de los roles (ROL_PREC). Mismo flujo que sucursales.
  const guardar = (valores: PrecioFormulario) =>
    salida.sinAviso("precio", async () => {
      const desactiva = estadoActual && !valores.estado
      if (desactiva && !(await confirmarDesactivacion())) {
        return false
      }
      const { mensaje } = await modificar.mutateAsync(valores)
      toast.success(mensaje)
      if (valores.estado !== estadoActual) {
        const respuesta = valores.estado
          ? await activar.mutateAsync(precioId)
          : await eliminar.mutateAsync(precioId)
        toast.success(respuesta.mensaje)
      }
      void navegar(rutaListado)
      return true
    })

  // Eliminar desde el encabezado: borrado lógico y vuelta al listado.
  const eliminarDesdeEncabezado = async () => {
    try {
      const { mensaje } = await eliminar.mutateAsync(precioId)
      toast.success(mensaje)
      void navegar(rutaListado)
    } catch (error) {
      toast.error(mensajeDeError(error), {
        description: detalleDeError(error),
      })
    }
  }

  return (
    <>
      <EncabezadoDetalle
        {...MIGAS}
        rutaListado={rutaListado}
        titulo={precio.data.descri}
        eliminacion={
          puedeEliminar && estadoActual
            ? {
                titulo: "Eliminar lista de precio",
                descripcion: (
                  <>
                    La lista de precio <strong>{precio.data.descri}</strong>{" "}
                    quedará en estado Inactivo y los roles perderán el acceso a
                    ella. ¿Desea continuar?
                  </>
                ),
                pendiente: eliminar.isPending,
                onConfirmar: eliminarDesdeEncabezado,
              }
            : undefined
        }
      />
      <FormularioPrecio
        valoresIniciales={aFormularioPrecio(precio.data)}
        esAlta={false}
        soloLectura={!puedeModificar}
        puedeCambiarEstado={puedeEliminar}
        textoGuardar="Guardar cambios"
        onGuardar={guardar}
        onCancelar={() => void navegar(rutaListado)}
        onCambiosPendientes={setCambios}
      />
      <DialogoCambiosSinGuardar salida={salida} />
      <DialogoConfirmacion
        abierto={respuestaConfirmacion !== null}
        onAbiertoChange={(abierto) => {
          if (!abierto) {
            responderConfirmacion(false)
          }
        }}
        titulo="Desactivar lista de precio"
        descripcion={
          <>
            La lista de precio <strong>{precio.data.descri}</strong> quedará en
            estado Inactivo y los roles perderán el acceso a ella. ¿Desea
            continuar?
          </>
        }
        textoConfirmar="Desactivar"
        onConfirmar={() => responderConfirmacion(true)}
      />
    </>
  )
}

/** Edición (o consulta sin permiso de modificar) de una lista de precio. */
export function PaginaPrecio() {
  const { precioId } = useParams()
  const listado = useRutaRetorno(RUTA_PRECIOS)
  const id = precioId && /^\d+$/.test(precioId) ? Number(precioId) : null

  return (
    <section className="flex flex-col gap-6">
      {id === null ? (
        <>
          <EncabezadoDetalle
            {...MIGAS}
            rutaListado={listado.ruta}
            titulo="Lista de precio"
          />
          <AvisoError mensaje="El recurso solicitado no existe" />
        </>
      ) : (
        <EdicionPrecio key={id} precioId={id} rutaListado={listado.ruta} />
      )}
    </section>
  )
}
