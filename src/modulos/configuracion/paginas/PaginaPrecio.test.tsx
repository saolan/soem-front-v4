import { cleanup, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { InitialEntry } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  renderizarPagina,
  respuestaApi,
  Ubicacion,
} from "@/compartido/pruebas/renderizarPagina"
import {
  PaginaNuevoPrecio,
  PaginaPrecio,
} from "@/modulos/configuracion/paginas/PaginaPrecio"

const precio = {
  precioId: 3,
  codigo: "DOC",
  descri: "Docena",
  alcanc: "NINGUNO",
  factor: "12.000000",
  estado: true,
}

const TODOS = [
  "configuracion-crud:buscar",
  "configuracion-crud:crear",
  "configuracion-crud:modificar",
  "configuracion-crud:eliminar",
]

// Edición abierta desde el listado filtrado (estadoRetorno del listado).
const DESDE_LISTADO = {
  pathname: "/configuracion/precios/3",
  state: { retorno: "?pagina=2&descri=doc" },
}

function renderizar(url: InitialEntry, permisos = TODOS) {
  return renderizarPagina({
    url,
    permisos,
    rutas: [
      {
        path: "/configuracion/precios/nuevo",
        element: <PaginaNuevoPrecio />,
      },
      {
        path: "/configuracion/precios/:precioId",
        element: <PaginaPrecio />,
      },
      { path: "/configuracion/precios", element: <Ubicacion /> },
    ],
  })
}

const cuerpoEnviado = (metodo: string): unknown => {
  const llamada = vi
    .mocked(fetch)
    .mock.calls.find(([, init]) => init?.method === metodo)
  return JSON.parse(String(llamada?.[1]?.body))
}

describe("PaginaPrecio", () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
  })

  afterEach(() => {
    cleanup()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  describe("alta", () => {
    it("crea la lista con el factor como string y vuelve al listado", async () => {
      fetchSimulado.mockResolvedValue(
        respuestaApi({ ...precio, factor: "12.500000" }, 201, {
          mensaje: "Lista de precio creada correctamente",
        })
      )
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/nuevo")

      await usuario.type(await screen.findByLabelText("Código"), "DOC")
      await usuario.type(screen.getByLabelText("Descripción"), "Docena")
      await usuario.clear(screen.getByLabelText("Factor"))
      await usuario.type(screen.getByLabelText("Factor"), "12.5")
      await usuario.click(
        screen.getByRole("button", { name: "Crear lista de precio" })
      )

      expect((await screen.findByLabelText("Ubicación")).textContent).toBe(
        "/configuracion/precios"
      )
      expect(String(fetchSimulado.mock.calls[0]?.[0])).toBe("/api/v1/precios")
      expect(cuerpoEnviado("POST")).toEqual({
        codigo: "DOC",
        descri: "Docena",
        alcanc: "NINGUNO",
        factor: "12.5",
        estado: true,
      })
    })

    it("valida en el front sin llamar al API", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/nuevo")

      await usuario.clear(await screen.findByLabelText("Factor"))
      await usuario.type(screen.getByLabelText("Factor"), "0")
      await usuario.click(
        screen.getByRole("button", { name: "Crear lista de precio" })
      )

      expect(await screen.findByText("El código es obligatorio")).toBeTruthy()
      expect(screen.getByText("El factor debe ser mayor que cero")).toBeTruthy()
      expect(fetchSimulado).not.toHaveBeenCalled()
    })

    it("muestra en cada campo los errores 409 del back-end", async () => {
      fetchSimulado.mockResolvedValue(
        respuestaApi(null, 409, {
          mensaje: "La lista de precio entra en conflicto con datos existentes",
          errores: [
            {
              campo: "codigo",
              detalle: "Ya existe una lista de precio con este código",
            },
            {
              campo: "descri",
              detalle: "Ya existe una lista de precio con esta descripción",
            },
          ],
        })
      )
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/nuevo")

      await usuario.type(await screen.findByLabelText("Código"), "DOC")
      await usuario.type(screen.getByLabelText("Descripción"), "Docena")
      await usuario.click(
        screen.getByRole("button", { name: "Crear lista de precio" })
      )

      const errorCodigo = await screen.findByText(
        "Ya existe una lista de precio con este código"
      )
      expect(
        screen.getByLabelText("Código").getAttribute("aria-describedby")
      ).toBe(errorCodigo.id)
      expect(
        screen.getByText("Ya existe una lista de precio con esta descripción")
      ).toBeTruthy()
      expect(
        screen.getByText(
          "La lista de precio entra en conflicto con datos existentes"
        )
      ).toBeTruthy()
    })

    it("limita la longitud de los campos según el DTO", async () => {
      renderizar("/configuracion/precios/nuevo")

      expect(
        (await screen.findByLabelText("Código")).getAttribute("maxlength")
      ).toBe("32")
      expect(
        screen.getByLabelText("Descripción").getAttribute("maxlength")
      ).toBe("100")
    })

    it("el alta permite elegir el alcance y no muestra el interruptor", async () => {
      renderizar("/configuracion/precios/nuevo")

      const alcance = await screen.findByRole("combobox", { name: /Alcance/ })
      expect(alcance.hasAttribute("disabled")).toBe(false)
      expect(screen.queryByRole("switch", { name: "Activa" })).toBeNull()
    })

    it("envía el alcance elegido por su nombre (TODOS)", async () => {
      fetchSimulado.mockResolvedValue(
        respuestaApi({ ...precio, alcanc: "TODOS" }, 201, {
          mensaje: "Lista de precio creada correctamente",
        })
      )
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/nuevo")

      await usuario.type(await screen.findByLabelText("Código"), "DOC")
      await usuario.type(screen.getByLabelText("Descripción"), "Docena")
      await usuario.click(screen.getByRole("combobox", { name: /Alcance/ }))
      await usuario.click(await screen.findByRole("option", { name: "TODOS" }))
      await usuario.click(
        screen.getByRole("button", { name: "Crear lista de precio" })
      )

      await screen.findByLabelText("Ubicación")
      expect(cuerpoEnviado("POST")).toMatchObject({ alcanc: "TODOS" })
    })

    it("sin permiso de crear muestra un aviso", async () => {
      renderizar("/configuracion/precios/nuevo", ["configuracion-crud:buscar"])

      expect(
        await screen.findByText("No tiene permiso para crear listas de precio.")
      ).toBeTruthy()
    })
  })

  describe("edición", () => {
    beforeEach(() => {
      fetchSimulado.mockImplementation(async (_url, init) =>
        init?.method === "PUT"
          ? respuestaApi(
              { ...precio, ...(JSON.parse(String(init.body)) as object) },
              200,
              { mensaje: "Lista de precio modificada correctamente" }
            )
          : init?.method === "DELETE"
            ? respuestaApi(null, 200, {
                mensaje: "Lista de precio eliminada correctamente",
              })
            : respuestaApi(precio)
      )
    })

    it("muestra migas de pan y el alcance bloqueado", async () => {
      renderizar("/configuracion/precios/3")

      expect(
        await screen.findByRole("heading", { name: "Docena" })
      ).toBeTruthy()
      const migas = screen.getByRole("navigation", {
        name: "Ruta de navegación",
      })
      expect(
        within(migas).getByRole("link", { name: "Listas de precio" })
      ).toBeTruthy()
      expect(
        screen
          .getByRole("combobox", { name: /Alcance/ })
          .hasAttribute("disabled")
      ).toBe(true)
    })

    it("al guardar hace PUT y vuelve al listado con sus filtros", async () => {
      const usuario = userEvent.setup()
      renderizar(DESDE_LISTADO)

      const descri = await screen.findByLabelText("Descripción")
      await usuario.clear(descri)
      await usuario.type(descri, "Docena mayorista")
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )

      expect((await screen.findByLabelText("Ubicación")).textContent).toBe(
        "/configuracion/precios?pagina=2&descri=doc"
      )
      expect(cuerpoEnviado("PUT")).toMatchObject({
        descri: "Docena mayorista",
        factor: "12.000000",
        estado: true,
      })
    })

    it("desactivar pide confirmación y envía el estado en el PUT", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/3")

      await usuario.click(await screen.findByRole("switch", { name: "Activa" }))
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )
      const dialogo = await screen.findByRole("alertdialog")
      await usuario.click(
        within(dialogo).getByRole("button", { name: "Desactivar" })
      )

      await screen.findByLabelText("Ubicación")
      expect(cuerpoEnviado("PUT")).toMatchObject({ estado: false })
      expect(
        fetchSimulado.mock.calls.some(([, init]) => init?.method === "DELETE")
      ).toBe(false)
    })

    it("muestra el 409 de una lista asignada a sucursales en el estado", async () => {
      fetchSimulado.mockImplementation(async (_url, init) =>
        init?.method === "PUT"
          ? respuestaApi(null, 409, {
              mensaje: "No se puede desactivar la lista de precio",
              errores: [
                {
                  campo: "estado",
                  detalle:
                    "La lista de precio está habilitada en 2 sucursales; quítela de ellas antes de desactivarla",
                },
              ],
            })
          : respuestaApi(precio)
      )
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/3")

      await usuario.click(await screen.findByRole("switch", { name: "Activa" }))
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )
      await usuario.click(
        within(await screen.findByRole("alertdialog")).getByRole("button", {
          name: "Desactivar",
        })
      )

      expect(
        await screen.findByText(
          "La lista de precio está habilitada en 2 sucursales; quítela de ellas antes de desactivarla"
        )
      ).toBeTruthy()
      expect(
        screen.getByText("No se puede desactivar la lista de precio")
      ).toBeTruthy()
    })

    it("elimina desde su pantalla y vuelve al listado", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/3")

      await usuario.click(
        await screen.findByRole("button", { name: "Eliminar" })
      )
      const dialogo = await screen.findByRole("alertdialog", {
        name: "Eliminar lista de precio",
      })
      await usuario.click(
        within(dialogo).getByRole("button", { name: "Eliminar" })
      )

      expect((await screen.findByLabelText("Ubicación")).textContent).toBe(
        "/configuracion/precios"
      )
      expect(
        fetchSimulado.mock.calls.some(
          ([url, init]) =>
            String(url) === "/api/v1/precios/3" && init?.method === "DELETE"
        )
      ).toBe(true)
    })

    it("sin permiso de modificar es de solo lectura", async () => {
      renderizar("/configuracion/precios/3", ["configuracion-crud:buscar"])

      const codigo = await screen.findByLabelText("Código")
      expect(codigo.closest("fieldset")?.disabled).toBe(true)
      expect(
        screen.queryByRole("button", { name: "Guardar cambios" })
      ).toBeNull()
      expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull()
      expect(screen.getByRole("button", { name: "Volver" })).toBeTruthy()
    })

    it("un id no numérico muestra que el recurso no existe", async () => {
      renderizar("/configuracion/precios/abc")

      expect(
        await screen.findByText("El recurso solicitado no existe")
      ).toBeTruthy()
      expect(fetchSimulado).not.toHaveBeenCalled()
    })
  })
})
