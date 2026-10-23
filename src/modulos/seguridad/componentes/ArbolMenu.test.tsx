import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { afterEach, describe, expect, it } from "vitest"

import { ArbolMenu } from "@/modulos/seguridad/componentes/ArbolMenu"
import type { MenuNodoDTO } from "@/modulos/seguridad/esquemas/menu"

const nodos: MenuNodoDTO[] = [
  {
    menuId: 1000,
    descri: "Configuración",
    detall: false,
    estado: true,
    hijos: [
      {
        menuId: 1050,
        descri: "Seguridad",
        detall: false,
        estado: true,
        hijos: [
          // Llega Rol antes que Usuario aunque su menuId es mayor.
          {
            menuId: 1300,
            descri: "Rol",
            paginaRuta: "/seguridad/roles",
            detall: true,
            estado: true,
            hijos: [],
          },
          {
            menuId: 1250,
            descri: "Usuario",
            paginaRuta: "/seguridad/usuarios",
            detall: true,
            estado: true,
            hijos: [],
          },
        ],
      },
    ],
  },
  {
    menuId: 2000,
    descri: "Caja",
    detall: false,
    estado: true,
    hijos: [
      {
        menuId: 2100,
        descri: "Cajas",
        paginaRuta: "/caja/cajas",
        detall: true,
        estado: true,
        hijos: [],
      },
    ],
  },
]

function Ubicacion() {
  return <output aria-label="Ubicación">{useLocation().pathname}</output>
}

function renderizar(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <ArbolMenu nodos={nodos} />
              <Ubicacion />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

const opcion = (nombre: string) =>
  screen.getByRole("treeitem", { name: nombre })
const tabulables = () =>
  screen
    .getAllByRole("treeitem")
    .filter((e) => e.getAttribute("tabindex") === "0")

describe("ArbolMenu", () => {
  afterEach(() => {
    cleanup()
  })

  it("abre los grupos de la página actual y la marca con aria-current", () => {
    renderizar("/seguridad/roles")

    expect(screen.getByRole("tree", { name: "Menú principal" })).toBeTruthy()
    expect(opcion("Configuración").getAttribute("aria-expanded")).toBe("true")
    expect(opcion("Seguridad").getAttribute("aria-expanded")).toBe("true")
    expect(opcion("Caja").getAttribute("aria-expanded")).toBe("false")
    expect(opcion("Rol").getAttribute("aria-current")).toBe("page")
    expect(opcion("Usuario").getAttribute("aria-current")).toBeNull()
    expect(tabulables()).toEqual([opcion("Rol")])
    expect(screen.getAllByRole("group")).toHaveLength(2)
    expect(screen.getAllByRole("treeitem").map((e) => e.textContent)).toEqual([
      "Configuración",
      "Seguridad",
      "Rol",
      "Usuario",
      "Caja",
    ])
  })

  it("se recorre con el teclado según el patrón Tree View", async () => {
    const usuario = userEvent.setup()
    renderizar("/")

    await usuario.tab()
    expect(document.activeElement).toBe(opcion("Configuración"))

    await usuario.keyboard("{ArrowRight}")
    expect(opcion("Configuración").getAttribute("aria-expanded")).toBe("true")
    await usuario.keyboard("{ArrowRight}")
    expect(document.activeElement).toBe(opcion("Seguridad"))
    await usuario.keyboard("{Enter}")
    expect(opcion("Seguridad").getAttribute("aria-expanded")).toBe("true")
    await usuario.keyboard("{ArrowDown}{ArrowDown}")
    expect(document.activeElement).toBe(opcion("Usuario"))
    expect(tabulables()).toEqual([opcion("Usuario")])

    await usuario.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(opcion("Seguridad"))
    await usuario.keyboard("{ArrowLeft}")
    expect(opcion("Seguridad").getAttribute("aria-expanded")).toBe("false")

    await usuario.keyboard("{End}")
    expect(document.activeElement).toBe(opcion("Caja"))
    await usuario.keyboard(" ")
    await usuario.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(opcion("Cajas"))
    await usuario.keyboard(" ")
    expect(screen.getByLabelText("Ubicación").textContent).toBe("/caja/cajas")
    expect(opcion("Cajas").getAttribute("aria-current")).toBe("page")

    await usuario.keyboard("{Home}")
    expect(document.activeElement).toBe(opcion("Configuración"))
    await usuario.keyboard("{ArrowUp}")
    expect(document.activeElement).toBe(opcion("Configuración"))
  })

  it("navega con Enter sobre una página", async () => {
    const usuario = userEvent.setup()
    renderizar("/seguridad/roles")

    await usuario.tab()
    await usuario.keyboard("{ArrowDown}{Enter}")
    expect(screen.getByLabelText("Ubicación").textContent).toBe(
      "/seguridad/usuarios"
    )
  })
})
