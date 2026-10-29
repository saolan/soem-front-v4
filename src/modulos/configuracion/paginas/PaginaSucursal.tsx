import { ArrowLeftIcon } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { mensajeDeError } from "@/compartido/api/errores"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CargandoPagina } from "@/compartido/componentes/CargandoPagina"
import { EncabezadoPagina } from "@/compartido/componentes/EncabezadoPagina"
import { buttonVariants } from "@/compartido/componentes/ui/button"
import { Separator } from "@/compartido/componentes/ui/separator"
import { useTienePermiso } from "@/compartido/sesion/useTienePermiso"
import {
  useCrearSucursal,
  useModificarSucursal,
  useSucursal,
} from "@/modulos/configuracion/api/sucursales"
import { FormularioCertificado } from "@/modulos/configuracion/componentes/FormularioCertificado"
import { FormularioSucursal } from "@/modulos/configuracion/componentes/FormularioSucursal"
import {
  aFormularioSucursal,
  valoresSucursalNueva,
  type SucursalFormulario,
} from "@/modulos/configuracion/esquemas/sucursal"

const RECURSO = "configuracion-crud"
export const RUTA_SUCURSALES = "/configuracion/sucursales"

function Volver() {
  return (
    <Link
      to={RUTA_SUCURSALES}
      className={buttonVariants({ variant: "ghost", size: "sm" })}
    >
      <ArrowLeftIcon aria-hidden="true" />
      Sucursales
    </Link>
  )
}

/** Alta de una sucursal. Al crearla se pasa a su edición (certificado). */
export function PaginaNuevaSucursal() {
  const navegar = useNavigate()
  const crear = useCrearSucursal()
  const puedeCrear = useTienePermiso(RECURSO, "crear")

  const guardar = async (valores: SucursalFormulario) => {
    const { datos, mensaje } = await crear.mutateAsync(valores)
    toast.success(mensaje)
    void navegar(`${RUTA_SUCURSALES}/${datos.sucursalId}`, { replace: true })
  }

  return (
    <section className="flex flex-col gap-6">
      <Volver />
      <EncabezadoPagina titulo="Nueva sucursal" />
      {puedeCrear ? (
        <FormularioSucursal
          valoresIniciales={valoresSucursalNueva}
          soloLectura={false}
          textoGuardar="Crear sucursal"
          onGuardar={guardar}
          onCancelar={() => void navegar(RUTA_SUCURSALES)}
        />
      ) : (
        <AvisoError mensaje="No tiene permiso para crear sucursales." />
      )}
    </section>
  )
}

function EdicionSucursal({ sucursalId }: { sucursalId: number }) {
  const navegar = useNavigate()
  const sucursal = useSucursal(sucursalId)
  const modificar = useModificarSucursal(sucursalId)
  const puedeModificar = useTienePermiso(RECURSO, "modificar")
  const puedeEliminar = useTienePermiso(RECURSO, "eliminar")

  if (sucursal.isPending) {
    return <CargandoPagina />
  }
  if (sucursal.isError) {
    return <AvisoError mensaje={mensajeDeError(sucursal.error)} />
  }

  const guardar = async (valores: SucursalFormulario) => {
    const { mensaje } = await modificar.mutateAsync(valores)
    toast.success(mensaje)
  }

  return (
    <>
      <EncabezadoPagina
        titulo={sucursal.data.descri}
        descripcion={`Código ${sucursal.data.codigo}`}
      />
      <FormularioSucursal
        valoresIniciales={aFormularioSucursal(sucursal.data)}
        soloLectura={!puedeModificar}
        textoGuardar="Guardar cambios"
        onGuardar={guardar}
        onCancelar={() => void navegar(RUTA_SUCURSALES)}
      />
      <Separator />
      <section
        aria-labelledby="titulo-certificado"
        className="flex flex-col gap-4"
      >
        <h2
          id="titulo-certificado"
          className="font-heading text-lg font-semibold"
        >
          Certificado de firma electrónica
        </h2>
        <FormularioCertificado
          sucursalId={sucursalId}
          puedeModificar={puedeModificar}
          puedeEliminar={puedeEliminar}
        />
      </section>
    </>
  )
}

/** Edición (o consulta sin permiso de modificar) de una sucursal. */
export function PaginaSucursal() {
  const { sucursalId } = useParams()
  const id = sucursalId && /^\d+$/.test(sucursalId) ? Number(sucursalId) : null

  return (
    <section className="flex flex-col gap-6">
      <Volver />
      {id === null ? (
        <AvisoError mensaje="El recurso solicitado no existe" />
      ) : (
        <EdicionSucursal key={id} sucursalId={id} />
      )}
    </section>
  )
}
