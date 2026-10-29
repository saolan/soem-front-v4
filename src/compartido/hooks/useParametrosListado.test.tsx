import { act, cleanup, renderHook } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router"
import { afterEach, describe, expect, it } from "vitest"

import { aPageIndex, aPaginaApi } from "@/compartido/api/paginacion"
import { useParametrosListado } from "@/compartido/hooks/useParametrosListado"

const configuracion = {
  camposOrden: ["codigo", "descri"],
  ordenPredeterminado: { ordenarPor: "descri", direccion: "asc" },
  filtros: ["descri", "estado"],
} as const

function renderizar(url: string) {
  return renderHook(
    () => ({
      listado: useParametrosListado(configuracion),
      ubicacion: useLocation(),
    }),
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
      ),
    }
  )
}

describe("paginación", () => {
  it("convierte entre pagina del API (desde 1) y pageIndex (desde 0)", () => {
    expect(aPageIndex(1)).toBe(0)
    expect(aPageIndex(3)).toBe(2)
    expect(aPaginaApi(0)).toBe(1)
    expect(aPaginaApi(2)).toBe(3)
  })
})

describe("useParametrosListado", () => {
  afterEach(() => {
    cleanup()
  })

  it("lee página, tamaño, orden y filtros de la URL", () => {
    const { result } = renderizar(
      "/x?pagina=3&tamanio=50&ordenarPor=codigo&direccion=desc&descri=norte&otro=1"
    )

    expect(result.current.listado.pagina).toBe(3)
    expect(result.current.listado.tamanio).toBe(50)
    expect(result.current.listado.orden).toEqual({
      ordenarPor: "codigo",
      direccion: "desc",
    })
    expect(result.current.listado.filtros).toEqual({ descri: "norte" })
  })

  it("usa los valores predeterminados ante parámetros inválidos", () => {
    const { result } = renderizar(
      "/x?pagina=-2&tamanio=999&ordenarPor=clave&direccion=arriba"
    )

    expect(result.current.listado.pagina).toBe(1)
    expect(result.current.listado.tamanio).toBe(20)
    expect(result.current.listado.orden).toEqual({
      ordenarPor: "descri",
      direccion: "asc",
    })
  })

  it("al filtrar u ordenar vuelve a la primera página", () => {
    const { result } = renderizar("/x?pagina=4")

    act(() =>
      result.current.listado.cambiarFiltros({ descri: " sur ", estado: "" })
    )
    expect(result.current.ubicacion.search).toBe("?descri=sur")

    act(() => result.current.listado.cambiarPagina(2))
    act(() =>
      result.current.listado.cambiarOrden({
        ordenarPor: "codigo",
        direccion: "desc",
      })
    )
    expect(result.current.listado.pagina).toBe(1)
    expect(result.current.ubicacion.search).toBe(
      "?descri=sur&ordenarPor=codigo&direccion=desc"
    )
  })
})
