import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ErrorApi } from "@/compartido/api/errores"
import type { Paginacion } from "@/compartido/api/esquemas"
import {
  TablaPaginada,
  type ColumnaTabla,
} from "@/compartido/componentes/TablaPaginada"

afterEach(cleanup)

interface Fila {
  id: number
  nombre: string
}

const columnas: ColumnaTabla<Fila>[] = [
  { id: "nombre", accessorKey: "nombre", header: "Nombre" },
]

function renderizar({
  datos,
  paginacion = null,
  error = null,
}: {
  datos: Fila[] | undefined
  paginacion?: Paginacion | null
  error?: unknown
}) {
  const onPagina = vi.fn()
  render(
    <TablaPaginada
      titulo="Listado de prueba"
      columnas={columnas}
      datos={datos}
      paginacion={paginacion}
      tamanio={20}
      orden={{ ordenarPor: "nombre", direccion: "asc" }}
      cargando={false}
      error={error}
      idFila={(fila) => String(fila.id)}
      tarjeta={(fila) => fila.nombre}
      onOrden={vi.fn()}
      onPagina={onPagina}
      onTamanio={vi.fn()}
      onReintentar={vi.fn()}
    />
  )
  return onPagina
}

describe("TablaPaginada", () => {
  it("una página posterior a la última pasa a la última", () => {
    const onPagina = renderizar({
      datos: [],
      paginacion: {
        pagina: 3,
        tamanio: 20,
        totalRegistros: 25,
        totalPaginas: 2,
      },
    })

    expect(onPagina).toHaveBeenCalledWith(2)
  })

  it("no cambia de página dentro del rango ni sin registros", () => {
    const onPagina = renderizar({
      datos: [],
      paginacion: {
        pagina: 1,
        tamanio: 20,
        totalRegistros: 0,
        totalPaginas: 0,
      },
    })

    expect(onPagina).not.toHaveBeenCalled()
  })

  it("sin permiso (403) no ofrece reintentar", () => {
    renderizar({
      datos: undefined,
      error: new ErrorApi(403, "No tiene permiso para realizar esta acción"),
    })

    expect(
      screen.getByText("No tiene permiso para realizar esta acción")
    ).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull()
  })

  it("ante un fallo de red ofrece reintentar", () => {
    renderizar({
      datos: undefined,
      error: new ErrorApi(0, "No se pudo conectar con el servidor"),
    })

    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy()
  })
})
