import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"

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

export interface EliminacionDetalle {
  /** Título del diálogo de confirmación (ej. "Eliminar sucursal"). */
  titulo: string
  descripcion: React.ReactNode
  pendiente: boolean
  /**
   * Elimina y avisa del resultado (no debe rechazar); el diálogo se cierra
   * al terminar.
   */
  onConfirmar: () => Promise<void>
}

interface PropsEncabezadoDetalle {
  /** Primer nivel de las migas de pan (ej. "Configuración"). */
  modulo: string
  /** Nombre del listado en las migas de pan (ej. "Sucursales"). */
  etiquetaListado: string
  rutaListado: string
  titulo: string
  /** Solo si el registro está activo y el usuario puede eliminarlo. */
  eliminacion?: EliminacionDetalle
}

/** Migas de pan, título y acción de eliminar de la pantalla de un registro. */
export function EncabezadoDetalle({
  modulo,
  etiquetaListado,
  rutaListado,
  titulo,
  eliminacion,
}: PropsEncabezadoDetalle) {
  const [confirmando, setConfirmando] = useState(false)

  const confirmar = async () => {
    try {
      await eliminacion?.onConfirmar()
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Breadcrumb aria-label="Ruta de navegación">
        <BreadcrumbList>
          <BreadcrumbItem>{modulo}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={rutaListado} />}>
              {etiquetaListado}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{titulo}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <EncabezadoPagina titulo={titulo}>
        {/* El borrado es lógico: un registro inactivo ya está eliminado y se
            reactiva con el interruptor de estado del formulario. */}
        {eliminacion && (
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

      {eliminacion && (
        <DialogoConfirmacion
          abierto={confirmando}
          onAbiertoChange={setConfirmando}
          titulo={eliminacion.titulo}
          descripcion={eliminacion.descripcion}
          textoConfirmar="Eliminar"
          pendiente={eliminacion.pendiente}
          onConfirmar={() => void confirmar()}
        />
      )}
    </div>
  )
}
