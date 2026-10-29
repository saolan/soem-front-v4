import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ControlesPaginacion } from "@/compartido/componentes/ControlesPaginacion"

afterEach(cleanup)

function renderizar(pagina: number, totalPaginas: number) {
  const onPagina = vi.fn()
  render(
    <ControlesPaginacion
      pagina={pagina}
      totalPaginas={totalPaginas}
      totalRegistros={totalPaginas * 20}
      tamanio={20}
      onPagina={onPagina}
      onTamanio={vi.fn()}
    />
  )
  return onPagina
}

function numerosVisibles() {
  return screen
    .getAllByRole("button", { name: /^Página \d+$/ })
    .map((boton) => boton.textContent)
}

describe("ControlesPaginacion", () => {
  it("muestra las páginas de cinco en cinco y marca la actual", () => {
    renderizar(7, 12)

    expect(numerosVisibles()).toEqual(["6", "7", "8", "9", "10"])
    expect(
      screen
        .getByRole("button", { name: "Página 7" })
        .getAttribute("aria-current")
    ).toBe("page")
    expect(
      screen
        .getByRole("button", { name: "Página 8" })
        .getAttribute("aria-current")
    ).toBeNull()
  })

  it("recorta el último bloque al total de páginas", () => {
    renderizar(12, 12)

    expect(numerosVisibles()).toEqual(["11", "12"])
  })

  it("navega al pulsar un número y no repite la página actual", async () => {
    const usuario = userEvent.setup()
    const onPagina = renderizar(2, 8)

    await usuario.click(screen.getByRole("button", { name: "Página 4" }))
    await usuario.click(screen.getByRole("button", { name: "Página 2" }))

    expect(onPagina).toHaveBeenCalledTimes(1)
    expect(onPagina).toHaveBeenCalledWith(4)
  })

  it("pasa al siguiente bloque con la flecha desde la página 5", async () => {
    const usuario = userEvent.setup()
    const onPagina = renderizar(5, 8)

    await usuario.click(
      screen.getByRole("button", { name: "Página siguiente" })
    )

    expect(onPagina).toHaveBeenCalledWith(6)
  })
})
