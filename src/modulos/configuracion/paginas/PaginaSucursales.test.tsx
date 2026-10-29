import { cleanup, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  renderizarPagina,
  respuestaApi,
  Ubicacion,
} from "@/compartido/pruebas/renderizarPagina"
import { PaginaSucursales } from "@/modulos/configuracion/paginas/PaginaSucursales"

const sucursal = {
  sucursalId: 1,
  codigo: "001",
  matriz: true,
  descri: "Matriz Quito",
  ruc: "1790011223001",
  razonSoci: "SAOLAN S.A.",
  ciudad: "Quito",
  direcc: "Av. Amazonas",
  direccEsta: "Av. Amazonas N1",
  telef1: "022345678",
  correo: "info@saolan.ec",
  repres: "Ana Pérez",
  represCedu: "1712345678",
  represDire: "Quito",
  rucCont: "1712345678001",
  estado: true,
}

const paginacion = {
  pagina: 1,
  tamanio: 20,
  totalRegistros: 1,
  totalPaginas: 1,
}

function renderizar(permisos: string[], url = "/configuracion/sucursales") {
  return renderizarPagina({
    url,
    permisos,
    rutas: [
      {
        path: "/configuracion/sucursales",
        element: (
          <>
            <PaginaSucursales />
            <Ubicacion />
          </>
        ),
      },
    ],
  })
}

const TODOS = [
  "configuracion-crud:buscar",
  "configuracion-crud:crear",
  "configuracion-crud:modificar",
  "configuracion-crud:eliminar",
]

describe("PaginaSucursales", () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
    fetchSimulado.mockImplementation(async (_url, init) =>
      init?.method === "DELETE"
        ? respuestaApi(null, 200, {
            mensaje: "Sucursal eliminada correctamente",
          })
        : respuestaApi([sucursal], 200, { paginacion })
    )
  })

  afterEach(() => {
    cleanup()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  const urls = () => fetchSimulado.mock.calls.map(([url]) => String(url))

  it("pide la página con el orden y los filtros de la URL", async () => {
    renderizar(TODOS, "/configuracion/sucursales?pagina=2&descri=quito")

    expect(await screen.findAllByText("Matriz Quito")).toHaveLength(2)
    expect(urls()[0]).toBe(
      "/api/v1/sucursales?pagina=2&tamanio=20&ordenarPor=descri&direccion=asc&descri=quito"
    )
  })

  it("ordena por columna en el servidor y lo refleja en la URL", async () => {
    const usuario = userEvent.setup()
    renderizar(TODOS)
    const tabla = await screen.findByRole("table", {
      name: "Listado de sucursales",
    })

    await usuario.click(within(tabla).getByRole("button", { name: /Código/ }))

    expect(screen.getByLabelText("Ubicación").textContent).toBe(
      "/configuracion/sucursales?ordenarPor=codigo&direccion=asc"
    )
    await vi.waitFor(() =>
      expect(urls().at(-1)).toContain("ordenarPor=codigo&direccion=asc")
    )
    expect(
      within(tabla)
        .getByRole("columnheader", { name: /Código/ })
        .getAttribute("aria-sort")
    ).toBe("ascending")
  })

  it("permite ordenar por Matriz y Estado", async () => {
    const usuario = userEvent.setup()
    renderizar(TODOS)
    const tabla = await screen.findByRole("table", {
      name: "Listado de sucursales",
    })

    await usuario.click(
      within(
        within(tabla).getByRole("columnheader", { name: /Estado/ })
      ).getByRole("button")
    )

    expect(screen.getByLabelText("Ubicación").textContent).toBe(
      "/configuracion/sucursales?ordenarPor=estado&direccion=asc"
    )
    const cabeceraMatriz = within(tabla).getByRole("columnheader", {
      name: /Matriz/,
    })
    expect(within(cabeceraMatriz).getByRole("button")).toBeTruthy()
  })

  it("aplica los filtros al buscar", async () => {
    const usuario = userEvent.setup()
    renderizar(TODOS)
    await screen.findByRole("table")

    await usuario.type(screen.getByLabelText("Descripción"), "Norte")
    await usuario.click(screen.getByRole("button", { name: "Buscar" }))

    expect(screen.getByLabelText("Ubicación").textContent).toBe(
      "/configuracion/sucursales?descri=Norte"
    )
  })

  it("elimina tras confirmar", async () => {
    const usuario = userEvent.setup()
    renderizar(TODOS)
    await screen.findAllByText("Matriz Quito")
    const tabla = screen.getByRole("table")

    await usuario.click(
      within(tabla).getByRole("button", { name: "Eliminar Matriz Quito" })
    )
    const dialogo = await screen.findByRole("alertdialog")
    await usuario.click(
      within(dialogo).getByRole("button", { name: "Eliminar" })
    )

    await vi.waitFor(() =>
      expect(
        fetchSimulado.mock.calls.some(
          ([url, init]) =>
            String(url) === "/api/v1/sucursales/1" && init?.method === "DELETE"
        )
      ).toBe(true)
    )
  })

  it("oculta las acciones sin permiso", async () => {
    renderizar(["configuracion-crud:buscar"])
    await screen.findAllByText("Matriz Quito")
    const tabla = screen.getByRole("table")

    expect(screen.queryByRole("link", { name: "Nuevo" })).toBeNull()
    expect(within(tabla).queryByRole("button", { name: /Eliminar/ })).toBeNull()
    expect(
      within(tabla).getByRole("link", { name: "Ver Matriz Quito" })
    ).toBeTruthy()
  })
})
