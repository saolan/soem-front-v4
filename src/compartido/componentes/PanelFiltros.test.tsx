import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { PanelFiltros } from "@/compartido/componentes/PanelFiltros"

afterEach(cleanup)

describe("PanelFiltros", () => {
  it("pliega y despliega los filtros en móvil", async () => {
    const usuario = userEvent.setup()
    render(
      <PanelFiltros etiqueta="Filtros de prueba" activos={0}>
        <p>contenido</p>
      </PanelFiltros>
    )
    const boton = screen.getByRole("button", { name: "Filtros" })
    const contenido = document.getElementById(
      boton.getAttribute("aria-controls") ?? ""
    )

    expect(boton.getAttribute("aria-expanded")).toBe("false")
    expect(contenido?.className.split(" ")).toContain("hidden")

    await usuario.click(boton)

    expect(boton.getAttribute("aria-expanded")).toBe("true")
    expect(contenido?.className.split(" ")).not.toContain("hidden")
  })

  it("muestra la cantidad de filtros aplicados", () => {
    render(
      <PanelFiltros etiqueta="Filtros de prueba" activos={2}>
        <p>contenido</p>
      </PanelFiltros>
    )

    expect(screen.getByRole("button", { name: "Filtros (2)" })).toBeTruthy()
    expect(
      screen.getByRole("search", { name: "Filtros de prueba" })
    ).toBeTruthy()
  })
})
