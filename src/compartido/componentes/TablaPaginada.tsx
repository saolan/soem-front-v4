import {
  flexRender,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type CellData,
  type ColumnDef,
  type RowData,
  type SortingState,
  type TableFeatures,
  type Updater,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { useEffect } from "react"

import { esReintentable, mensajeDeError } from "@/compartido/api/errores"
import type { Paginacion } from "@/compartido/api/esquemas"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { ControlesPaginacion } from "@/compartido/componentes/ControlesPaginacion"
import { Button } from "@/compartido/componentes/ui/button"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import type { OrdenListado } from "@/compartido/hooks/useParametrosListado"
import { cn } from "@/compartido/utilidades/cn"

const FILAS_ESQUELETO = 5

/* eslint-disable @typescript-eslint/no-unused-vars --
   la ampliación debe repetir los parámetros de tipo de ColumnMeta */
declare module "@tanstack/react-table" {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  > {
    /**
     * Clases de la cabecera de la columna. Con `table-fixed` el ancho de la
     * cabecera fija el de toda la columna (ej. `w-28`); sin ancho, la columna
     * ocupa el espacio restante.
     */
    clase?: string
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// El orden lo resuelve el servidor (manualSorting); la paginación no pasa
// por la tabla porque `datos` ya es la página pedida al API.
const caracteristicas = tableFeatures({ rowSortingFeature })
const SIN_FILAS: never[] = []

/** Definición de columna para `TablaPaginada`. */
export type ColumnaTabla<T extends RowData> = ColumnDef<
  typeof caracteristicas,
  T
>

interface PropsTablaPaginada<T extends RowData, C extends string> {
  /** Nombre accesible de la tabla (caption). */
  titulo: string
  /**
   * El `id` de cada columna ordenable es el campo `ordenarPor` del API;
   * las demás se declaran con `enableSorting: false`.
   */
  columnas: ColumnaTabla<T>[]
  datos: T[] | undefined
  paginacion: Paginacion | null | undefined
  tamanio: number
  orden: OrdenListado<C>
  cargando: boolean
  /** Hay una petición en curso mostrando la página anterior. */
  actualizando?: boolean
  error: unknown
  idFila: (fila: T) => string
  /** Presentación en tarjetas para pantallas menores a `md`. */
  tarjeta: (fila: T) => React.ReactNode
  mensajeVacio?: string
  onOrden: (orden: OrdenListado<C>) => void
  onPagina: (pagina: number) => void
  onTamanio: (tamanio: number) => void
  onReintentar: () => void
}

/**
 * Listado paginado y ordenado en el servidor (TanStack Table en modo
 * manual). En móvil cada fila se presenta como tarjeta.
 */
export function TablaPaginada<T extends RowData, C extends string>({
  titulo,
  columnas,
  datos,
  paginacion,
  tamanio,
  orden,
  cargando,
  actualizando = false,
  error,
  idFila,
  tarjeta,
  mensajeVacio = "No hay registros que coincidan con la búsqueda.",
  onOrden,
  onPagina,
  onTamanio,
  onReintentar,
}: PropsTablaPaginada<T, C>) {
  const sorting: SortingState = [
    { id: orden.ordenarPor, desc: orden.direccion === "desc" },
  ]
  const tabla = useTable({
    features: caracteristicas,
    columns: columnas,
    data: datos ?? SIN_FILAS,
    getRowId: idFila,
    manualSorting: true,
    state: { sorting },
    onSortingChange: (actualizacion: Updater<SortingState>) => {
      const [nuevo] =
        typeof actualizacion === "function"
          ? actualizacion(sorting)
          : actualizacion
      if (nuevo) {
        onOrden({
          ordenarPor: nuevo.id as C,
          direccion: nuevo.desc ? "desc" : "asc",
        })
      }
    },
  })

  // Una página posterior a la última (p. ej. tras eliminar el único registro
  // de la última página con un filtro) se corrige a la última que existe.
  const totalPaginas = paginacion?.totalPaginas ?? 0
  const paginaActual = paginacion?.pagina ?? 0
  useEffect(() => {
    if (totalPaginas > 0 && paginaActual > totalPaginas) {
      onPagina(totalPaginas)
    }
  }, [paginaActual, totalPaginas, onPagina])

  const ordenarPor = (campo: string) =>
    onOrden({
      ordenarPor: campo as C,
      direccion:
        orden.ordenarPor === campo && orden.direccion === "asc"
          ? "desc"
          : "asc",
    })

  if (error && !datos) {
    return (
      <div className="flex flex-col items-start gap-3">
        <AvisoError mensaje={mensajeDeError(error)} />
        {esReintentable(error) && (
          <Button variant="outline" onClick={onReintentar}>
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  const filas = tabla.getRowModel().rows
  const vacio = !cargando && filas.length === 0

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        actualizando && "opacity-60 transition-opacity"
      )}
      aria-busy={cargando || actualizando}
    >
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table className="table-fixed">
          <TableCaption className="sr-only">{titulo}</TableCaption>
          <TableHeader className="bg-encabezado-tabla">
            {tabla.getHeaderGroups().map((grupo) => (
              <TableRow key={grupo.id}>
                {grupo.headers.map((encabezado) => {
                  const contenido = flexRender(
                    encabezado.column.columnDef.header,
                    encabezado.getContext()
                  )
                  if (!encabezado.column.getCanSort()) {
                    return (
                      <TableHead
                        key={encabezado.id}
                        className={encabezado.column.columnDef.meta?.clase}
                      >
                        {contenido}
                      </TableHead>
                    )
                  }
                  const activo = orden.ordenarPor === encabezado.column.id
                  const IconoOrden = !activo
                    ? ArrowUpDownIcon
                    : orden.direccion === "asc"
                      ? ArrowUpIcon
                      : ArrowDownIcon
                  return (
                    <TableHead
                      key={encabezado.id}
                      className={encabezado.column.columnDef.meta?.clase}
                      aria-sort={
                        activo
                          ? orden.direccion === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 text-sm hover:bg-encabezado-tabla-hover dark:hover:bg-encabezado-tabla-hover"
                        onClick={() => ordenarPor(encabezado.column.id)}
                      >
                        {contenido}
                        <IconoOrden aria-hidden="true" />
                      </Button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {cargando
              ? Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
                  <TableRow key={i}>
                    {columnas.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filas.map((fila) => (
                  <TableRow key={fila.id} className="hover:bg-accent/50">
                    {fila.getAllCells().map((celda) => (
                      <TableCell
                        key={celda.id}
                        className="break-words whitespace-normal"
                      >
                        {flexRender(
                          celda.column.columnDef.cell,
                          celda.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            {vacio && (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  {mensajeVacio}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ul aria-label={titulo} className="flex flex-col gap-3 md:hidden">
        {cargando
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <Skeleton className="h-28 w-full" />
              </li>
            ))
          : filas.map((fila) => (
              <li key={fila.id}>{tarjeta(fila.original)}</li>
            ))}
        {vacio && (
          <li className="py-6 text-center text-muted-foreground">
            {mensajeVacio}
          </li>
        )}
      </ul>

      {cargando && (
        <span role="status" className="sr-only">
          Cargando registros…
        </span>
      )}

      {paginacion && paginacion.totalRegistros > 0 && (
        <ControlesPaginacion
          pagina={paginacion.pagina}
          totalPaginas={paginacion.totalPaginas}
          totalRegistros={paginacion.totalRegistros}
          tamanio={tamanio}
          onPagina={onPagina}
          onTamanio={onTamanio}
        />
      )}
    </div>
  )
}
