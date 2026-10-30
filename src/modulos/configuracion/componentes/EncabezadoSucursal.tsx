import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { mensajeDeError } from "@/compartido/api/errores"
import { DialogoConfirmacion } from "@/compartido/componentes/DialogoConfirmacion"
import { EncabezadoPagina } from "@/compartido/componentes/EncabezadoPagina"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/compartido/componentes/ui/breadcrumb"
import { Button } from "@/compartido/componentes/ui/button"
import { useEliminarSucursal } from "@/modulos/configuracion/api/sucursales"
import type { SucursalDTO } from "@/modulos/configuracion/esquemas/sucursal"

interface PropsEncabezadoSucursal {
  rutaListado: string
  /** Título cuando no hay sucursal (alta, o una que no se pudo cargar). */
  titulo?: string
  sucursal?: SucursalDTO
  puedeEliminar?: boolean
}

/** Migas de pan, título y acción de eliminar de una sucursal. */
export function EncabezadoSucursal({
  rutaListado,
  titulo: tituloSinSucursal = "Nueva sucursal",
  sucursal,
  puedeEliminar = false,
}: PropsEncabezadoSucursal) {
  const navegar = useNavigate()
  const eliminar = useEliminarSucursal()
  const [confirmando, setConfirmando] = useState(false)
  const titulo = sucursal?.descri ?? tituloSinSucursal

  const confirmarEliminacion = () => {
    if (!sucursal) {
      return
    }
    eliminar.mutate(sucursal.sucursalId, {
      onSuccess: ({ mensaje }) => {
        toast.success(mensaje)
        void navegar(rutaListado)
      },
      onError: (error) => toast.error(mensajeDeError(error)),
      onSettled: () => setConfirmando(false),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Breadcrumb aria-label="Ruta de navegación">
        <BreadcrumbList>
          <BreadcrumbItem>Configuración</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={rutaListado} />}>
              Sucursales
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{titulo}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <EncabezadoPagina titulo={titulo}>
        {/* El borrado es lógico: una sucursal inactiva ya está eliminada y se
            reactiva con el interruptor "Activa" del formulario. */}
        {sucursal && puedeEliminar && sucursal.estado && (
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmando(true)}
          >
            <Trash2Icon aria-hidden="true" />
            Eliminar
          </Button>
        )}
      </EncabezadoPagina>

      <DialogoConfirmacion
        abierto={confirmando}
        onAbiertoChange={setConfirmando}
        titulo="Eliminar sucursal"
        descripcion={
          <>
            La sucursal <strong>{titulo}</strong> quedará inactiva. ¿Desea
            continuar?
          </>
        }
        textoConfirmar="Eliminar"
        pendiente={eliminar.isPending}
        onConfirmar={confirmarEliminacion}
      />
    </div>
  )
}
