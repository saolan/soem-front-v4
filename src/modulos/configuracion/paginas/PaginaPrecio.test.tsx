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
  factor: "12",
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

/** Peticiones hechas, en orden, como "MÉTODO /ruta". */
const metodosLlamados = () =>
  vi
    .mocked(fetch)
    .mock.calls.map(([url, init]) => `${init?.method ?? "GET"} ${String(url)}`)

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
        respuestaApi({ ...precio, factor: "12.5" }, 201, {
          mensaje: "Lista de precio creada correctamente",
        })
      )
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/nuevo")

      await usuario.type(await screen.findByLabelText("Código"), "DOC")
      await usuario.type(screen.getByLabelText("Descripción"), "Docena")
      await usuario.clear(screen.getByLabelText("Factor"))
      await usuario.type(screen.getByLabelText("Factor"), "12.5")
      await usuario.click(screen.getByRole("button", { name: "Crear precio" }))

      expect((await screen.findByLabelText("Ubicación")).textContent).toBe(
        "/configuracion/precios"
      )
      expect(String(fetchSimulado.mock.calls[0]?.[0])).toBe("/api/v1/precios")
      // Sin `estado`: el back-end crea toda lista activa.
      expect(cuerpoEnviado("POST")).toEqual({
        codigo: "DOC",
        descri: "Docena",
        alcanc: "NINGUNO",
        factor: "12.5",
      })
    })

    it("valida en el front sin llamar al API", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/nuevo")

      await usuario.clear(await screen.findByLabelText("Factor"))
      await usuario.type(screen.getByLabelText("Factor"), "0")
      await usuario.click(screen.getByRole("button", { name: "Crear precio" }))

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
      await usuario.click(screen.getByRole("button", { name: "Crear precio" }))

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

    it("al abrir el alta el cursor queda en Código", async () => {
      renderizar("/configuracion/precios/nuevo")

      const codigo = await screen.findByLabelText("Código")
      await vi.waitFor(() => expect(document.activeElement).toBe(codigo))
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

      const alcance = await screen.findByRole("radiogroup", {
        name: /Alcance/,
      })
      // Las dos opciones con su efecto; NINGUNO elegido por defecto.
      const todos = within(alcance).getByRole("radio", {
        name: "Todos",
      })
      const ninguno = within(alcance).getByRole("radio", {
        name: "Ninguno",
      })
      expect(todos.getAttribute("aria-checked")).toBe("false")
      expect(ninguno.getAttribute("aria-checked")).toBe("true")
      expect(
        document.getElementById(todos.getAttribute("aria-describedby") ?? "")
          ?.textContent
      ).toContain("Crea el precio en cero de cada producto activo")
      expect(screen.queryByRole("switch", { name: "Estado" })).toBeNull()
    })

    it("el alcance se elige con el teclado (flechas)", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/nuevo")

      const ninguno = await screen.findByRole("radio", {
        name: "Ninguno",
      })
      ninguno.focus()
      await usuario.keyboard("{ArrowUp}")

      const todos = screen.getByRole("radio", { name: "Todos" })
      expect(todos.getAttribute("aria-checked")).toBe("true")
      expect(document.activeElement).toBe(todos)
      expect(await screen.findByRole("alert")).toBeTruthy()
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
      // NINGUNO (por defecto) no avisa; TODOS destaca su efecto irreversible.
      expect(screen.queryByRole("alert")).toBeNull()
      // Clic en el título de la tarjeta: toda la tarjeta es la etiqueta.
      await usuario.click(screen.getByText("Todos"))
      expect((await screen.findByRole("alert")).textContent).toContain(
        "Esta elección no se puede deshacer"
      )
      await usuario.click(screen.getByRole("button", { name: "Crear precio" }))

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
      // Inmutable: solo la opción elegida, deshabilitada.
      const alcance = screen.getByRole("radiogroup", { name: /Alcance/ })
      const opciones = within(alcance).getAllByRole("radio")
      expect(opciones).toHaveLength(1)
      expect(
        within(alcance)
          .getByRole("radio", { name: "Ninguno" })
          .hasAttribute("data-disabled")
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
      expect(cuerpoEnviado("PUT")).toEqual({
        codigo: "DOC",
        descri: "Docena mayorista",
        alcanc: "NINGUNO",
        factor: "12",
      })
    })

    it("desactivar pide confirmación: PUT de los datos y luego DELETE", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/3")

      const estado = await screen.findByRole("switch", { name: "Estado" })
      const campoEstado = estado.closest("[data-slot=field]")
      expect(campoEstado?.textContent).toContain("Activo")
      await usuario.click(estado)
      expect(campoEstado?.textContent).toContain("Inactivo")
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )
      const dialogo = await screen.findByRole("alertdialog")
      expect(dialogo.textContent).toContain(
        "quedará en estado Inactivo y los roles perderán el acceso a ella"
      )
      await usuario.click(
        within(dialogo).getByRole("button", { name: "Desactivar" })
      )

      // El PUT ignora el estado: los datos van en el PUT y la desactivación
      // es un DELETE (borrado lógico sin restricción).
      await screen.findByLabelText("Ubicación")
      expect(cuerpoEnviado("PUT")).not.toHaveProperty("estado")
      expect(metodosLlamados()).toEqual([
        "GET /api/v1/precios/3",
        "PUT /api/v1/precios/3",
        "DELETE /api/v1/precios/3",
      ])
    })

    it("reactivar desde la edición: PUT de los datos y luego /activar", async () => {
      fetchSimulado.mockImplementation(async (url, init) =>
        String(url).endsWith("/activar")
          ? respuestaApi(precio, 200, {
              mensaje: "Lista de precio activada correctamente",
            })
          : init?.method === "PUT"
            ? respuestaApi({ ...precio, estado: false }, 200, {
                mensaje: "Lista de precio modificada correctamente",
              })
            : respuestaApi({ ...precio, estado: false })
      )
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/3")

      const estado = await screen.findByRole("switch", { name: "Estado" })
      await usuario.click(estado)
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )

      // Reactivar no es destructivo: sin confirmación.
      await screen.findByLabelText("Ubicación")
      expect(screen.queryByRole("alertdialog")).toBeNull()
      expect(metodosLlamados()).toEqual([
        "GET /api/v1/precios/3",
        "PUT /api/v1/precios/3",
        "PUT /api/v1/precios/3/activar",
      ])
    })

    it("sin cambiar el estado solo hace el PUT de los datos", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/precios/3")

      const descri = await screen.findByLabelText("Descripción")
      await usuario.type(descri, " x")
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )

      await screen.findByLabelText("Ubicación")
      expect(metodosLlamados()).toEqual([
        "GET /api/v1/precios/3",
        "PUT /api/v1/precios/3",
      ])
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

    it("al abrir la edición el cursor queda en Código", async () => {
      renderizar("/configuracion/precios/3")

      const codigo = await screen.findByLabelText("Código")
      await vi.waitFor(() => expect(document.activeElement).toBe(codigo))
    })

    it("sin permiso de modificar es de solo lectura", async () => {
      renderizar("/configuracion/precios/3", ["configuracion-crud:buscar"])

      const codigo = await screen.findByLabelText("Código")
      expect(codigo.closest("fieldset")?.disabled).toBe(true)
      // Nada que editar: no se enfoca el campo.
      expect(document.activeElement).not.toBe(codigo)
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
