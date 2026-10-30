import { PlusIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { Link, useLocation } from "react-router"
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
import { estadoRetorno } from "@/compartido/hooks/useRutaRetorno"
import { useTienePermiso } from "@/compartido/sesion/useTienePermiso"
import {
  useActivarSucursal,
  useEliminarSucursal,
  useSucursales,
} from "@/modulos/configuracion/api/sucursales"
import {
  RECURSO_CONFIGURACION,
  RUTA_NUEVA_SUCURSAL,
} from "@/modulos/configuracion/constantes"
import { AccionesSucursal } from "@/modulos/configuracion/componentes/AccionesSucursal"
import { FiltrosSucursales } from "@/modulos/configuracion/componentes/FiltrosSucursales"
import { TarjetaSucursal } from "@/modulos/configuracion/componentes/TarjetaSucursal"
import {
  CAMPOS_ORDEN_SUCURSAL,
  FILTROS_SUCURSAL,
  type SucursalDTO,
} from "@/modulos/configuracion/esquemas/sucursal"

const configuracionListado = {
  camposOrden: CAMPOS_ORDEN_SUCURSAL,
  ordenPredeterminado: { ordenarPor: "descri", direccion: "asc" },
  filtros: FILTROS_SUCURSAL,
} as const

export function PaginaSucursales() {
  const { search } = useLocation()
  const listado = useParametrosListado(configuracionListado)
  const { pagina, tamanio, orden, filtros } = listado
  const sucursales = useSucursales({ pagina, tamanio, orden, filtros })
  const eliminar = useEliminarSucursal()
  const [porEliminar, setPorEliminar] = useState<SucursalDTO | null>(null)

  const puedeCrear = useTienePermiso(RECURSO_CONFIGURACION, "crear")
  const puedeModificar = useTienePermiso(RECURSO_CONFIGURACION, "modificar")
  const puedeEliminar = useTienePermiso(RECURSO_CONFIGURACION, "eliminar")

  // Reactivar no es destructivo: sin confirmación.
  const { mutate: mutarActivar, isPending: activando } = useActivarSucursal()
  const activar = useCallback(
    (sucursal: SucursalDTO) =>
      mutarActivar(sucursal.sucursalId, {
        onSuccess: ({ mensaje }) => toast.success(mensaje),
        onError: (error) => toast.error(mensajeDeError(error)),
      }),
    [mutarActivar]
  )

  // Compartido por la columna de la tabla y la tarjeta móvil.
  const acciones = useCallback(
    (sucursal: SucursalDTO) => (
      <AccionesSucursal
        sucursal={sucursal}
        puedeModificar={puedeModificar}
        puedeEliminar={puedeEliminar}
        onEliminar={setPorEliminar}
        onActivar={activar}
        activando={activando}
      />
    ),
    [puedeModificar, puedeEliminar, activar, activando]
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
        cell: ({ row }) => acciones(row.original),
      },
    ],
    [acciones]
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
              to={RUTA_NUEVA_SUCURSAL}
              state={estadoRetorno(search)}
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
