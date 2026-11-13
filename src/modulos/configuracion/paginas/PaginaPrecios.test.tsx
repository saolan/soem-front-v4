import { cleanup, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  renderizarPagina,
  respuestaApi,
  Ubicacion,
} from "@/compartido/pruebas/renderizarPagina"
import { PaginaPrecios } from "@/modulos/configuracion/paginas/PaginaPrecios"

const precio = {
  precioId: 3,
  codigo: "DOC",
  descri: "Docena",
  alcanc: "TODOS",
  factor: "12",
  estado: true,
}

const paginacion = {
  pagina: 1,
  tamanio: 20,
  totalRegistros: 1,
  totalPaginas: 1,
}

function renderizar(permisos: string[], url = "/configuracion/precios") {
  return renderizarPagina({
    url,
    permisos,
    rutas: [
      {
        path: "/configuracion/precios",
        element: (
          <>
            <PaginaPrecios />
            <Ubicacion />
          </>
        ),
      },
      { path: "/configuracion/precios/:precioId", element: <Ubicacion /> },
    ],
  })
}

const TODOS = [
  "configuracion-crud:buscar",
  "configuracion-crud:crear",
  "configuracion-crud:modificar",
  "configuracion-crud:eliminar",
]

describe("PaginaPrecios", () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
    fetchSimulado.mockImplementation(async (_url, init) =>
      init?.method === "DELETE"
        ? respuestaApi(null, 200, {
            mensaje: "Lista de precio eliminada correctamente",
          })
        : respuestaApi([precio], 200, { paginacion })
    )
  })

  afterEach(() => {
    cleanup()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  const urls = () => fetchSimulado.mock.calls.map(([url]) => String(url))

  it("pide la página con el orden y los filtros de la URL", async () => {
    renderizar(TODOS, "/configuracion/precios?pagina=2&descri=doc")

    expect(await screen.findAllByText("Docena")).toHaveLength(2)
    expect(urls()[0]).toBe(
      "/api/v1/precios?pagina=2&tamanio=20&ordenarPor=descri&direccion=asc&descri=doc"
    )
  })

  it("muestra el factor con formato y el alcance con su texto legible", async () => {
    renderizar(TODOS)
    const tabla = await screen.findByRole("table", {
      name: "Listado de listas de precio",
    })

    // La tabla aparece primero con el skeleton de carga: espera a los datos.
    expect(await within(tabla).findByText("12")).toBeTruthy()
    expect(within(tabla).getByText("Todos")).toBeTruthy()
  })

  it("ordena por Factor en el servidor", async () => {
    const usuario = userEvent.setup()
    renderizar(TODOS)
    const tabla = await screen.findByRole("table")

    await usuario.click(within(tabla).getByRole("button", { name: /Factor/ }))

    expect(screen.getByLabelText("Ubicación").textContent).toBe(
      "/configuracion/precios?ordenarPor=factor&direccion=asc"
    )
    await vi.waitFor(() =>
      expect(urls().at(-1)).toContain("ordenarPor=factor&direccion=asc")
    )
  })

  it("aplica los filtros al buscar", async () => {
    const usuario = userEvent.setup()
    renderizar(TODOS)
    await screen.findByRole("table")

    await usuario.type(screen.getByLabelText("Código"), "DOC")
    await usuario.click(screen.getByRole("button", { name: "Buscar" }))

    expect(screen.getByLabelText("Ubicación").textContent).toBe(
      "/configuracion/precios?codigo=DOC"
    )
  })

  it("elimina tras confirmar", async () => {
    const usuario = userEvent.setup()
    renderizar(TODOS)
    await screen.findAllByText("Docena")

    await usuario.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Eliminar Docena",
      })
    )
    const dialogo = await screen.findByRole("alertdialog")
    await usuario.click(
      within(dialogo).getByRole("button", { name: "Eliminar" })
    )

    await vi.waitFor(() =>
      expect(
        fetchSimulado.mock.calls.some(
          ([url, init]) =>
            String(url) === "/api/v1/precios/3" && init?.method === "DELETE"
        )
      ).toBe(true)
    )
  })

  it("al fallar la eliminación avisa el mensaje y el detalle del API", async () => {
    const errorToast = vi.spyOn(toast, "error")
    fetchSimulado.mockImplementation(async (_url, init) =>
      init?.method === "DELETE"
        ? respuestaApi(null, 409, {
            mensaje: "La operación entra en conflicto con otro registro",
            errores: [
              {
                campo: null,
                detalle: "La lista de precio está en uso",
              },
            ],
          })
        : respuestaApi([precio], 200, { paginacion })
    )
    const usuario = userEvent.setup()
    renderizar(TODOS)
    await screen.findAllByText("Docena")

    await usuario.click(
      within(screen.getByRole("table")).getByRole("button", {
        name: "Eliminar Docena",
      })
    )
    const dialogo = await screen.findByRole("alertdialog")
    await usuario.click(
      within(dialogo).getByRole("button", { name: "Eliminar" })
    )

    await vi.waitFor(() =>
      expect(errorToast).toHaveBeenCalledWith(
        "La operación entra en conflicto con otro registro",
        {
          description: "La lista de precio está en uso",
        }
      )
    )
    errorToast.mockRestore()
  })

  it("una lista inactiva se reactiva con PUT /activar, sin cuerpo", async () => {
    fetchSimulado.mockImplementation(async (_url, init) =>
      init?.method === "PUT"
        ? respuestaApi(precio, 200, {
            mensaje: "Lista de precio activada correctamente",
          })
        : respuestaApi([{ ...precio, estado: false }], 200, { paginacion })
    )
    const usuario = userEvent.setup()
    renderizar(TODOS)
    await screen.findAllByText("Docena")
    const tabla = screen.getByRole("table")

    expect(
      within(tabla).queryByRole("button", { name: "Eliminar Docena" })
    ).toBeNull()
    await usuario.click(
      within(tabla).getByRole("button", { name: "Activar Docena" })
    )

    await vi.waitFor(() => {
      const put = fetchSimulado.mock.calls.find(
        ([, init]) => init?.method === "PUT"
      )
      expect(String(put?.[0])).toBe("/api/v1/precios/3/activar")
      expect(put?.[1]?.body).toBeUndefined()
    })
  })

  it("oculta las acciones sin permiso", async () => {
    renderizar(["configuracion-crud:buscar"])
    await screen.findAllByText("Docena")
    const tabla = screen.getByRole("table")

    expect(screen.queryByRole("link", { name: "Nuevo" })).toBeNull()
    expect(within(tabla).queryByRole("button", { name: /Eliminar/ })).toBeNull()
    expect(within(tabla).getByRole("link", { name: "Ver Docena" })).toBeTruthy()
  })
})
