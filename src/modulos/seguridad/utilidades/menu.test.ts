import { describe, expect, it } from "vitest"

import {
  esquemaMenuNodoDTO,
  type MenuNodoDTO,
} from "@/modulos/seguridad/esquemas/menu"
import {
  ancestrosDe,
  paginaActual,
  rutasDelMenu,
} from "@/modulos/seguridad/utilidades/menu"

function pagina(menuId: number, paginaRuta: string): MenuNodoDTO {
  return {
    menuId,
    descri: paginaRuta,
    paginaRuta,
    detall: true,
    estado: true,
    hijos: [],
  }
}

function grupo(menuId: number, hijos: MenuNodoDTO[]): MenuNodoDTO {
  return {
    menuId,
    descri: `Grupo ${menuId}`,
    detall: false,
    estado: true,
    hijos,
  }
}

const arbol = [
  grupo(1000, [
    grupo(1050, [pagina(1300, "/seguridad/roles")]),
    pagina(1400, "/configuracion/dimms"),
    pagina(1450, "/configuracion/dimms/modificar-iva"),
  ]),
  pagina(2000, "/caja/cajas"),
]

describe("esquemaMenuNodoDTO", () => {
  it("acepta grupos sin paginaRuta (JSON-B omite los null) y anidados", () => {
    const resultado = esquemaMenuNodoDTO.safeParse({
      menuId: 1000,
      descri: "Configuración",
      detall: false,
      estado: true,
      hijos: [
        {
          menuId: 1300,
          descri: "Rol",
          paginaRuta: "/seguridad/roles",
          detall: true,
          estado: true,
          hijos: [],
        },
      ],
    })
    expect(resultado.success).toBe(true)
  })

  it("rechaza un nodo sin detall", () => {
    const resultado = esquemaMenuNodoDTO.safeParse({
      menuId: 1,
      descri: "X",
      estado: true,
      hijos: [],
    })
    expect(resultado.success).toBe(false)
  })
})

describe("utilidades del menú", () => {
  it("reúne las rutas de las páginas", () => {
    expect([...rutasDelMenu(arbol)]).toEqual([
      "/seguridad/roles",
      "/configuracion/dimms",
      "/configuracion/dimms/modificar-iva",
      "/caja/cajas",
    ])
  })

  it("elige la página con la ruta más larga que contiene la URL", () => {
    expect(
      paginaActual(arbol, "/configuracion/dimms/modificar-iva")?.menuId
    ).toBe(1450)
    expect(paginaActual(arbol, "/configuracion/dimms")?.menuId).toBe(1400)
    expect(paginaActual(arbol, "/seguridad/roles/5")?.menuId).toBe(1300)
    expect(paginaActual(arbol, "/seguridad/rolesx")).toBeNull()
  })

  it("devuelve los grupos ancestros desde la raíz", () => {
    expect(ancestrosDe(arbol, 1300)).toEqual([1000, 1050])
    expect(ancestrosDe(arbol, 1400)).toEqual([1000])
    expect(ancestrosDe(arbol, 2000)).toEqual([])
  })
})
