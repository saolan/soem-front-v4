import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { BotonIcono, EnlaceIcono } from "@/compartido/componentes/BotonIcono"

afterEach(cleanup)

describe("BotonIcono", () => {
  it("usa la etiqueta como nombre accesible si no hay aria-label", () => {
    render(<BotonIcono etiqueta="Eliminar">x</BotonIcono>)

    expect(screen.getByRole("button", { name: "Eliminar" })).toBeTruthy()
  })

  it("muestra el tooltip al pasar el puntero y ejecuta la acción", async () => {
    const usuario = userEvent.setup()
    const onClick = vi.fn()
    render(
      <BotonIcono
        etiqueta="Eliminar"
        aria-label="Eliminar Matriz"
        onClick={onClick}
      >
        x
      </BotonIcono>
    )
    const boton = screen.getByRole("button", { name: "Eliminar Matriz" })

    await usuario.hover(boton)
    expect(
      await screen.findByText("Eliminar", {}, { timeout: 2000 })
    ).toBeTruthy()

    await usuario.click(boton)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe("EnlaceIcono", () => {
  it("es un enlace (no un botón) con su ruta y tooltip", async () => {
    const usuario = userEvent.setup()
    render(
      <MemoryRouter>
        <EnlaceIcono
          etiqueta="Modificar"
          aria-label="Modificar Matriz"
          ruta="/x/1"
        >
          x
        </EnlaceIcono>
      </MemoryRouter>
    )
    const enlace = screen.getByRole("link", { name: "Modificar Matriz" })

    expect(enlace.getAttribute("href")).toBe("/x/1")
    expect(screen.queryByRole("button")).toBeNull()

    await usuario.hover(enlace)
    expect(
      await screen.findByText("Modificar", {}, { timeout: 2000 })
    ).toBeTruthy()
  })
})
