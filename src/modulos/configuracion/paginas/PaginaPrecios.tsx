import { PlusIcon } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { Link, useLocation } from "react-router"
import { toast } from "sonner"

import { detalleDeError, mensajeDeError } from "@/compartido/api/errores"
import { AccionesRegistro } from "@/compartido/componentes/AccionesRegistro"
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
import { formatoDecimal } from "@/compartido/utilidades/numero"
import {
  useActivarPrecio,
  useEliminarPrecio,
  usePrecios,
} from "@/modulos/configuracion/api/precios"
import {
  RECURSO_CONFIGURACION,
  RUTA_NUEVO_PRECIO,
  rutaPrecio,
} from "@/modulos/configuracion/constantes"
import { FiltrosPrecios } from "@/modulos/configuracion/componentes/FiltrosPrecios"
import { TarjetaPrecio } from "@/modulos/configuracion/componentes/TarjetaPrecio"
import {
  CAMPOS_ORDEN_PRECIO,
  ETIQUETAS_ALCANCE,
  FILTROS_PRECIO,
  type PrecioDTO,
} from "@/modulos/configuracion/esquemas/precio"

const configuracionListado = {
  camposOrden: CAMPOS_ORDEN_PRECIO,
  ordenPredeterminado: { ordenarPor: "descri", direccion: "asc" },
  filtros: FILTROS_PRECIO,
} as const

export function PaginaPrecios() {
  const { search } = useLocation()
  const listado = useParametrosListado(configuracionListado)
  const { pagina, tamanio, orden, filtros } = listado
  const precios = usePrecios({ pagina, tamanio, orden, filtros })
  const eliminar = useEliminarPrecio()
  const [porEliminar, setPorEliminar] = useState<PrecioDTO | null>(null)

  const puedeCrear = useTienePermiso(RECURSO_CONFIGURACION, "crear")
  const puedeModificar = useTienePermiso(RECURSO_CONFIGURACION, "modificar")
  const puedeEliminar = useTienePermiso(RECURSO_CONFIGURACION, "eliminar")

  // Reactivar no es destructivo: sin confirmación.
  const { mutate: mutarActivar, isPending: activando } = useActivarPrecio()
  const activar = useCallback(
    (precio: PrecioDTO) =>
      mutarActivar(precio.precioId, {
        onSuccess: ({ mensaje }) => toast.success(mensaje),
        onError: (error) =>
          toast.error(mensajeDeError(error), {
            description: detalleDeError(error),
          }),
      }),
    [mutarActivar]
  )

  // Compartido por la columna de la tabla y la tarjeta móvil.
  const acciones = useCallback(
    (precio: PrecioDTO) => (
      <AccionesRegistro
        descripcion={precio.descri}
        ruta={rutaPrecio(precio.precioId)}
        activo={precio.estado}
        puedeModificar={puedeModificar}
        puedeEliminar={puedeEliminar}
        onEliminar={() => setPorEliminar(precio)}
        onActivar={() => activar(precio)}
        activando={activando}
      />
    ),
    [puedeModificar, puedeEliminar, activar, activando]
  )

  const columnas = useMemo<ColumnaTabla<PrecioDTO>[]>(
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
        id: "factor",
        accessorKey: "factor",
        header: "Factor",
        meta: { clase: "w-28" },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatoDecimal(row.original.factor)}
          </span>
        ),
      },
      {
        id: "alcanc",
        accessorKey: "alcanc",
        header: "Alcance",
        meta: { clase: "w-44" },
        cell: ({ row }) => (
          <Badge variant="secondary">
            {ETIQUETAS_ALCANCE[row.original.alcanc]}
          </Badge>
        ),
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
    eliminar.mutate(porEliminar.precioId, {
      onSuccess: ({ mensaje }) => toast.success(mensaje),
      onError: (error) =>
        toast.error(mensajeDeError(error), {
          description: detalleDeError(error),
        }),
      onSettled: () => setPorEliminar(null),
    })
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <EncabezadoPagina titulo="Listas de precio">
          {puedeCrear && (
            <Link
              to={RUTA_NUEVO_PRECIO}
              state={estadoRetorno(search)}
              className={buttonVariants({ className: "w-24" })}
            >
              <PlusIcon aria-hidden="true" />
              Nuevo
            </Link>
          )}
        </EncabezadoPagina>
        <Separator />
        <FiltrosPrecios
          key={JSON.stringify(filtros)}
          filtros={filtros}
          onAplicar={listado.cambiarFiltros}
        />
      </div>

      <TablaPaginada
        titulo="Listado de listas de precio"
        columnas={columnas}
        datos={precios.data?.datos}
        paginacion={precios.data?.paginacion}
        tamanio={tamanio}
        orden={orden}
        cargando={precios.isPending}
        actualizando={precios.isPlaceholderData}
        error={precios.error}
        idFila={(precio) => String(precio.precioId)}
        tarjeta={(precio) => (
          <TarjetaPrecio precio={precio} acciones={acciones(precio)} />
        )}
        onOrden={listado.cambiarOrden}
        onPagina={listado.cambiarPagina}
        onTamanio={listado.cambiarTamanio}
        onReintentar={() => void precios.refetch()}
      />

      <DialogoConfirmacion
        abierto={porEliminar !== null}
        onAbiertoChange={(abierto) => {
          if (!abierto) {
            setPorEliminar(null)
          }
        }}
        titulo="Eliminar lista de precio"
        descripcion={
          <>
            La lista de precio <strong>{porEliminar?.descri}</strong> quedará en
            estado Inactivo y los roles perderán el acceso a ella. ¿Desea
            continuar?
          </>
        }
        textoConfirmar="Eliminar"
        pendiente={eliminar.isPending}
        onConfirmar={confirmarEliminacion}
      />
    </section>
  )
}
