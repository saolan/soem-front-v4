import { PlusIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"

import { mensajeDeError } from "@/compartido/api/errores"
import { DialogoConfirmacion } from "@/compartido/componentes/DialogoConfirmacion"
import { EncabezadoPagina } from "@/compartido/componentes/EncabezadoPagina"
import { EtiquetaEstado } from "@/compartido/componentes/EtiquetaEstado"
import {
  TablaPaginada,
  type ColumnaTabla,
} from "@/compartido/componentes/TablaPaginada"
import { Badge } from "@/compartido/componentes/ui/badge"
import { buttonVariants } from "@/compartido/componentes/ui/button"
import { Separator } from "@/compartido/componentes/ui/separator"
import { useParametrosListado } from "@/compartido/hooks/useParametrosListado"
import { useTienePermiso } from "@/compartido/sesion/useTienePermiso"
import {
  useEliminarSucursal,
  useSucursales,
} from "@/modulos/configuracion/api/sucursales"
import { AccionesSucursal } from "@/modulos/configuracion/componentes/AccionesSucursal"
import { FiltrosSucursales } from "@/modulos/configuracion/componentes/FiltrosSucursales"
import { TarjetaSucursal } from "@/modulos/configuracion/componentes/TarjetaSucursal"
import {
  CAMPOS_ORDEN_SUCURSAL,
  FILTROS_SUCURSAL,
  type SucursalDTO,
} from "@/modulos/configuracion/esquemas/sucursal"

// Permisos del módulo (SucursalControlador#RECURSO).
const RECURSO = "configuracion-crud"

const configuracionListado = {
  camposOrden: CAMPOS_ORDEN_SUCURSAL,
  ordenPredeterminado: { ordenarPor: "descri", direccion: "asc" },
  filtros: FILTROS_SUCURSAL,
} as const

export function PaginaSucursales() {
  const listado = useParametrosListado(configuracionListado)
  const { pagina, tamanio, orden, filtros } = listado
  const sucursales = useSucursales({ pagina, tamanio, orden, filtros })
  const eliminar = useEliminarSucursal()
  const [porEliminar, setPorEliminar] = useState<SucursalDTO | null>(null)

  const puedeCrear = useTienePermiso(RECURSO, "crear")
  const puedeModificar = useTienePermiso(RECURSO, "modificar")
  const puedeEliminar = useTienePermiso(RECURSO, "eliminar")

  const acciones = (sucursal: SucursalDTO) => (
    <AccionesSucursal
      sucursal={sucursal}
      puedeModificar={puedeModificar}
      puedeEliminar={puedeEliminar}
      onEliminar={setPorEliminar}
    />
  )

  const columnas = useMemo<ColumnaTabla<SucursalDTO>[]>(
    () => [
      {
        id: "codigo",
        accessorKey: "codigo",
        header: "Código",
        meta: { clase: "w-28" },
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.codigo}</span>
        ),
      },
      { id: "descri", accessorKey: "descri", header: "Descripción" },
      {
        id: "ruc",
        accessorKey: "ruc",
        header: "RUC",
        meta: { clase: "w-40" },
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.ruc}</span>
        ),
      },
      {
        id: "matriz",
        accessorKey: "matriz",
        header: "Matriz",
        meta: { clase: "w-28" },
        cell: ({ row }) =>
          row.original.matriz ? (
            <Badge variant="secondary">Matriz</Badge>
          ) : null,
      },
      {
        id: "estado",
        accessorKey: "estado",
        header: "Estado",
        meta: { clase: "w-28" },
        cell: ({ row }) => <EtiquetaEstado activo={row.original.estado} />,
      },
      {
        id: "acciones",
        header: "Acciones",
        meta: { clase: "w-28" },
        enableSorting: false,
        cell: ({ row }) => (
          <AccionesSucursal
            sucursal={row.original}
            puedeModificar={puedeModificar}
            puedeEliminar={puedeEliminar}
            onEliminar={setPorEliminar}
          />
        ),
      },
    ],
    [puedeModificar, puedeEliminar]
  )

  const confirmarEliminacion = () => {
    if (!porEliminar) {
      return
    }
    eliminar.mutate(porEliminar.sucursalId, {
      onSuccess: ({ mensaje }) => toast.success(mensaje),
      onError: (error) => toast.error(mensajeDeError(error)),
      onSettled: () => setPorEliminar(null),
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <EncabezadoPagina titulo="Sucursales">
          {puedeCrear && (
            <Link
              to="/configuracion/sucursales/nueva"
              className={buttonVariants({ className: "w-24" })}
            >
              <PlusIcon aria-hidden="true" />
              Nuevo
            </Link>
          )}
        </EncabezadoPagina>
        <Separator />
        <FiltrosSucursales
          key={JSON.stringify(filtros)}
          filtros={filtros}
          onAplicar={listado.cambiarFiltros}
        />
      </div>

      <TablaPaginada
        titulo="Listado de sucursales"
        columnas={columnas}
        datos={sucursales.data?.datos}
        paginacion={sucursales.data?.paginacion}
        tamanio={tamanio}
        orden={orden}
        cargando={sucursales.isPending}
        actualizando={sucursales.isPlaceholderData}
        error={sucursales.error}
        idFila={(sucursal) => String(sucursal.sucursalId)}
        tarjeta={(sucursal) => (
          <TarjetaSucursal sucursal={sucursal} acciones={acciones(sucursal)} />
        )}
        onOrden={listado.cambiarOrden}
        onPagina={listado.cambiarPagina}
        onTamanio={listado.cambiarTamanio}
        onReintentar={() => void sucursales.refetch()}
      />

      <DialogoConfirmacion
        abierto={porEliminar !== null}
        onAbiertoChange={(abierto) => {
          if (!abierto) {
            setPorEliminar(null)
          }
        }}
        titulo="Eliminar sucursal"
        descripcion={
          <>
            La sucursal <strong>{porEliminar?.descri}</strong> quedará inactiva.
            ¿Desea continuar?
          </>
        }
        textoConfirmar="Eliminar"
        pendiente={eliminar.isPending}
        onConfirmar={confirmarEliminacion}
      />
    </section>
  )
}
