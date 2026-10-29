import { describe, expect, it } from "vitest"

import {
  aPageIndex,
  aPaginaApi,
  paginasDelBloque,
} from "@/compartido/api/paginacion"

describe("conversión de página", () => {
  it("convierte entre pagina (desde 1) y pageIndex (desde 0)", () => {
    expect(aPageIndex(1)).toBe(0)
    expect(aPageIndex(0)).toBe(0)
    expect(aPaginaApi(0)).toBe(1)
    expect(aPaginaApi(-1)).toBe(1)
  })
})

describe("paginasDelBloque", () => {
  it("muestra el primer bloque de cinco", () => {
    expect(paginasDelBloque(3, 12)).toEqual([1, 2, 3, 4, 5])
  })

  it("pasa al siguiente bloque desde la página 6", () => {
    expect(paginasDelBloque(6, 12)).toEqual([6, 7, 8, 9, 10])
    expect(paginasDelBloque(10, 12)).toEqual([6, 7, 8, 9, 10])
  })

  it("recorta el último bloque al total de páginas", () => {
    expect(paginasDelBloque(12, 12)).toEqual([11, 12])
  })

  it("muestra la página 1 cuando no hay resultados", () => {
    expect(paginasDelBloque(1, 0)).toEqual([1])
  })

  it("ajusta una página fuera de rango", () => {
    expect(paginasDelBloque(99, 7)).toEqual([6, 7])
  })
})
