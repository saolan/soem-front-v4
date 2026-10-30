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
  PaginaNuevaSucursal,
  PaginaSucursal,
} from "@/modulos/configuracion/paginas/PaginaSucursal"

const sucursal = {
  sucursalId: 7,
  codigo: "001",
  matriz: false,
  descri: "Norte",
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

const TODOS = [
  "configuracion-crud:buscar",
  "configuracion-crud:crear",
  "configuracion-crud:modificar",
  "configuracion-crud:eliminar",
]

// Edición abierta desde el listado filtrado (estadoRetorno del listado).
const DESDE_LISTADO = {
  pathname: "/configuracion/sucursales/7",
  state: { retorno: "?pagina=2&descri=nor" },
}

function renderizar(url: InitialEntry, permisos = TODOS) {
  return renderizarPagina({
    url,
    permisos,
    rutas: [
      {
        path: "/configuracion/sucursales/nueva",
        element: <PaginaNuevaSucursal />,
      },
      {
        path: "/configuracion/sucursales/:sucursalId",
        element: (
          <>
            <PaginaSucursal />
            <Ubicacion />
          </>
        ),
      },
      { path: "/configuracion/sucursales", element: <Ubicacion /> },
    ],
  })
}

async function llenarObligatorios(usuario: ReturnType<typeof userEvent.setup>) {
  const campos: [string, string][] = [
    ["Código", "001"],
    ["Descripción", "Norte"],
    ["RUC", "1790011223001"],
    ["Razón social", "SAOLAN S.A."],
    ["Ciudad", "Quito"],
    ["Dirección", "Av. Amazonas"],
    ["Dirección del establecimiento", "Av. Amazonas N1"],
    ["Correo", "info@saolan.ec"],
    ["Teléfono principal", "022345678"],
    ["Nombre del representante", "Ana Pérez"],
    ["Cédula del representante", "1712345678"],
    ["Dirección del representante", "Quito"],
    ["RUC contable", "1712345678001"],
  ]
  for (const [etiqueta, valor] of campos) {
    await usuario.type(screen.getByLabelText(etiqueta), valor)
  }
}

describe("PaginaSucursal", () => {
  const fetchSimulado = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchSimulado)
  })

  afterEach(() => {
    cleanup()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
  })

  it("muestra en cada campo los errores 409 del back-end", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaApi(null, 409, {
        mensaje: "La sucursal entra en conflicto con datos existentes",
        errores: [
          {
            campo: "codigo",
            detalle: "Ya existe una sucursal con este código",
          },
          { campo: "ruc", detalle: "Ya existe una sucursal con este RUC" },
        ],
      })
    )
    const usuario = userEvent.setup()
    renderizar("/configuracion/sucursales/nueva")

    await llenarObligatorios(usuario)
    await usuario.click(screen.getByRole("button", { name: "Crear sucursal" }))

    const errorCodigo = await screen.findByText(
      "Ya existe una sucursal con este código"
    )
    expect(
      screen.getByLabelText("Código").getAttribute("aria-describedby")
    ).toBe(errorCodigo.id)
    expect(screen.getByText("Ya existe una sucursal con este RUC")).toBeTruthy()
    expect(
      screen.getByText("La sucursal entra en conflicto con datos existentes")
    ).toBeTruthy()
    const [url, init] = fetchSimulado.mock.calls[0] ?? []
    expect(url).toBe("/api/v1/sucursales")
    const cuerpo: unknown = JSON.parse(String(init?.body))
    expect(cuerpo).toMatchObject({
      codigo: "001",
      matriz: false,
      nombreCome: null,
    })
    // El estado es de solo lectura en la API: no se envía.
    expect(cuerpo).not.toHaveProperty("estado")
  })

  it("marca los campos obligatorios", async () => {
    renderizar("/configuracion/sucursales/nueva")

    expect(
      (await screen.findByLabelText("Código")).getAttribute("aria-required")
    ).toBe("true")
    expect(
      screen.getByLabelText("Nombre comercial").getAttribute("aria-required")
    ).toBeNull()
  })

  it("limita la longitud de los campos según el DTO", async () => {
    renderizar("/configuracion/sucursales/nueva")

    expect(
      (await screen.findByLabelText("Código")).getAttribute("maxlength")
    ).toBe("32")
    expect(screen.getByLabelText("RUC").getAttribute("maxlength")).toBe("13")
    expect(
      screen.getByLabelText("Teléfono principal").getAttribute("maxlength")
    ).toBe("10")
  })

  it("valida en el front sin llamar al API", async () => {
    const usuario = userEvent.setup()
    renderizar("/configuracion/sucursales/nueva")

    await usuario.click(screen.getByRole("button", { name: "Crear sucursal" }))

    expect(await screen.findByText("El código es obligatorio")).toBeTruthy()
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  it("al crear pasa a la edición de la sucursal", async () => {
    fetchSimulado.mockImplementation(async (url, init) => {
      const ruta = String(url)
      if (init?.method === "POST") return respuestaApi(sucursal, 201)
      if (ruta.endsWith("/certificado-emision")) return respuestaApi(null, 404)
      if (ruta.endsWith("/combo")) return respuestaApi([])
      return respuestaApi(sucursal)
    })
    const usuario = userEvent.setup()
    renderizar("/configuracion/sucursales/nueva")

    await llenarObligatorios(usuario)
    await usuario.click(screen.getByRole("button", { name: "Crear sucursal" }))

    expect((await screen.findByLabelText("Ubicación")).textContent).toBe(
      "/configuracion/sucursales/7"
    )
    // El detalle sale de la respuesta del POST: no se vuelve a pedir.
    expect(await screen.findByRole("heading", { name: "Norte" })).toBeTruthy()
    expect(
      fetchSimulado.mock.calls.some(
        ([url]) => String(url) === "/api/v1/sucursales/7"
      )
    ).toBe(false)
  })

  it("certificado: sin certificado exige la clave y refleja el error del servicio", async () => {
    fetchSimulado.mockImplementation(async (url, init) => {
      const ruta = String(url)
      if (ruta.endsWith("/certificado-emision") && init?.method === "PUT") {
        return respuestaApi(null, 400, {
          mensaje: "La clave del certificado es obligatoria",
          errores: [
            {
              campo: "certificadoEmisor.clave",
              detalle: "La clave del certificado es obligatoria",
            },
          ],
        })
      }
      if (ruta.endsWith("/certificado-emision")) return respuestaApi(null, 404)
      if (ruta.endsWith("/combo")) {
        return respuestaApi([{ valor: 3, etiqueta: "Security Data" }])
      }
      return respuestaApi(sucursal)
    })
    const usuario = userEvent.setup()
    renderizar("/configuracion/sucursales/7")

    expect(
      await screen.findByText(
        "La sucursal aún no tiene un certificado de firma electrónica."
      )
    ).toBeTruthy()
    await usuario.click(
      screen.getByRole("button", { name: "Guardar certificado" })
    )
    expect(
      await screen.findByText("La clave del certificado es obligatoria")
    ).toBeTruthy()

    // Clave escrita pero el servicio la rechaza con su propio nombre de campo.
    await usuario.click(screen.getByLabelText("Emisor del certificado"))
    await usuario.click(
      await screen.findByRole("option", { name: "Security Data" })
    )
    await usuario.type(
      screen.getByLabelText("Ruta del archivo del certificado"),
      "C:/f.p12"
    )
    await usuario.type(
      screen.getByLabelText("Descripción del certificado"),
      "Firma"
    )
    await usuario.type(
      screen.getByLabelText("Clave del certificado"),
      "secreta"
    )
    await usuario.click(
      screen.getByRole("button", { name: "Guardar certificado" })
    )

    const clave = screen.getByLabelText("Clave del certificado")
    await vi.waitFor(() =>
      expect(clave.getAttribute("aria-invalid")).toBe("true")
    )
    const put = fetchSimulado.mock.calls.find(
      ([, init]) => init?.method === "PUT"
    )
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({
      certEmisId: 3,
      ruta: "C:/f.p12",
      descri: "Firma",
      clave: "secreta",
    })
  })

  it("sin permiso de modificar: sin asteriscos ni formulario de certificado vacío", async () => {
    fetchSimulado.mockImplementation(async (url) => {
      const ruta = String(url)
      if (ruta.endsWith("/certificado-emision")) return respuestaApi(null, 404)
      if (ruta.endsWith("/combo")) return respuestaApi([])
      return respuestaApi(sucursal)
    })
    renderizar("/configuracion/sucursales/7", ["configuracion-crud:buscar"])

    expect(
      await screen.findByText(
        "La sucursal aún no tiene un certificado de firma electrónica."
      )
    ).toBeTruthy()
    expect(
      screen.getByLabelText("Código").getAttribute("aria-required")
    ).toBeNull()
    expect(screen.queryByLabelText("Emisor del certificado")).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Guardar certificado" })
    ).toBeNull()
  })

  describe("interruptor Activa", () => {
    // `estado` del detalle que devuelve el GET; el PUT /activar la devuelve activa.
    function simularApi(estado: boolean) {
      fetchSimulado.mockImplementation(async (url, init) => {
        const ruta = String(url)
        if (ruta.endsWith("/activar")) {
          return respuestaApi({ ...sucursal, estado: true }, 200, {
            mensaje: "Sucursal activada correctamente",
          })
        }
        if (init?.method === "DELETE") {
          return respuestaApi(null, 200, {
            mensaje: "Sucursal eliminada correctamente",
          })
        }
        if (ruta.endsWith("/certificado-emision"))
          return respuestaApi(null, 404)
        if (ruta.endsWith("/combo")) return respuestaApi([])
        if (init?.method === "PUT") return respuestaApi({ ...sucursal, estado })
        return respuestaApi({ ...sucursal, estado })
      })
    }

    const llamada = (metodo: string, url: string) =>
      fetchSimulado.mock.calls.some(
        ([u, init]) => String(u) === url && init?.method === metodo
      )

    it("reactiva al guardar: PUT de los datos y luego /activar", async () => {
      simularApi(false)
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      await usuario.click(await screen.findByRole("switch", { name: "Activa" }))
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Ubicación").textContent).toBe(
          "/configuracion/sucursales"
        )
      )
      expect(llamada("PUT", "/api/v1/sucursales/7")).toBe(true)
      expect(llamada("PUT", "/api/v1/sucursales/7/activar")).toBe(true)
      const put = fetchSimulado.mock.calls.find(
        ([u, init]) =>
          String(u) === "/api/v1/sucursales/7" && init?.method === "PUT"
      )
      expect(JSON.parse(String(put?.[1]?.body))).not.toHaveProperty("estado")
    })

    it("desactivar pide confirmación y al confirmar elimina", async () => {
      simularApi(true)
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      await usuario.click(await screen.findByRole("switch", { name: "Activa" }))
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )
      const dialogo = await screen.findByRole("alertdialog", {
        name: "Desactivar sucursal",
      })
      await usuario.click(
        within(dialogo).getByRole("button", { name: "Desactivar" })
      )

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Ubicación").textContent).toBe(
          "/configuracion/sucursales"
        )
      )
      expect(llamada("PUT", "/api/v1/sucursales/7")).toBe(true)
      expect(llamada("DELETE", "/api/v1/sucursales/7")).toBe(true)
    })

    it("al cancelar la confirmación no guarda y conserva los cambios", async () => {
      simularApi(true)
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      const activa = await screen.findByRole("switch", { name: "Activa" })
      await usuario.click(activa)
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )
      const dialogo = await screen.findByRole("alertdialog", {
        name: "Desactivar sucursal",
      })
      await usuario.click(
        within(dialogo).getByRole("button", { name: "Cancelar" })
      )

      await vi.waitFor(() =>
        expect(screen.queryByRole("alertdialog")).toBeNull()
      )
      expect(llamada("PUT", "/api/v1/sucursales/7")).toBe(false)
      expect(llamada("DELETE", "/api/v1/sucursales/7")).toBe(false)
      expect(screen.getByText("Cambios sin guardar")).toBeTruthy()
      expect(screen.getByLabelText("Ubicación").textContent).toBe(
        "/configuracion/sucursales/7"
      )
    })

    it("sin permiso de eliminar el interruptor está deshabilitado", async () => {
      simularApi(false)
      renderizar("/configuracion/sucursales/7", [
        "configuracion-crud:buscar",
        "configuracion-crud:modificar",
      ])

      const activa = await screen.findByRole("switch", { name: "Activa" })
      expect(activa.hasAttribute("data-disabled")).toBe(true)
      expect(screen.getByText("Requiere permiso para eliminar.")).toBeTruthy()
      expect(screen.queryByRole("button", { name: "Activar" })).toBeNull()
    })

    it("el alta no muestra el interruptor (se crea activa)", async () => {
      renderizar("/configuracion/sucursales/nueva")

      await screen.findByRole("switch", { name: "Matriz" })
      expect(screen.queryByRole("switch", { name: "Activa" })).toBeNull()
    })
  })

  it("el formulario no ofrece autocompletar con los datos del usuario", async () => {
    renderizar("/configuracion/sucursales/nueva")

    const correo = await screen.findByLabelText("Correo")
    expect(correo.closest("form")?.getAttribute("autocomplete")).toBe("off")
    expect(correo.getAttribute("autocomplete")).toBeNull()
  })

  it("rotula el emisor del certificado si ya no está activo", async () => {
    fetchSimulado.mockImplementation(async (url) => {
      const ruta = String(url)
      if (ruta.endsWith("/certificado-emision")) {
        return respuestaApi({
          certEmisId: 3,
          ruta: "C:/f.p12",
          descri: "Firma",
        })
      }
      if (ruta.endsWith("/combo")) {
        return respuestaApi([{ valor: 5, etiqueta: "Security Data" }])
      }
      return respuestaApi(sucursal)
    })
    renderizar("/configuracion/sucursales/7")

    const emisor = await screen.findByLabelText("Emisor del certificado")
    await vi.waitFor(() =>
      expect(emisor.textContent).toContain("Emisor inactivo, elija otro")
    )
  })

  describe("edición", () => {
    beforeEach(() => {
      fetchSimulado.mockImplementation(async (url, init) => {
        const ruta = String(url)
        if (init?.method === "DELETE") return respuestaApi(null)
        if (ruta.endsWith("/certificado-emision")) {
          return respuestaApi({
            certEmisId: 3,
            ruta: "C:/f.p12",
            descri: "Firma",
          })
        }
        if (ruta.endsWith("/combo")) return respuestaApi([])
        return respuestaApi(sucursal)
      })
    })

    it("muestra migas de pan, estado y certificado configurado", async () => {
      renderizar("/configuracion/sucursales/7")

      expect(await screen.findByRole("heading", { name: "Norte" })).toBeTruthy()
      const migas = screen.getByRole("navigation", {
        name: "Ruta de navegación",
      })
      expect(migas.textContent).toContain("Sucursales")
      // El encabezado solo muestra la descripción.
      expect(screen.queryByText("Código 001")).toBeNull()
      expect(screen.queryByText("Activo")).toBeNull()
      expect(await screen.findByText("Configurado")).toBeTruthy()
    })

    it("habilita Guardar certificado solo con cambios pendientes", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      const guardar = await screen.findByRole("button", {
        name: "Guardar certificado",
      })
      expect(guardar.hasAttribute("disabled")).toBe(true)

      await usuario.type(
        screen.getByLabelText("Descripción del certificado"),
        " 2"
      )
      expect(guardar.hasAttribute("disabled")).toBe(false)
    })

    it("al guardar el certificado vuelve al listado con sus filtros", async () => {
      const usuario = userEvent.setup()
      renderizar(DESDE_LISTADO)

      await usuario.type(
        await screen.findByLabelText("Descripción del certificado"),
        " 2"
      )
      await usuario.click(
        screen.getByRole("button", { name: "Guardar certificado" })
      )

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Ubicación").textContent).toBe(
          "/configuracion/sucursales?pagina=2&descri=nor"
        )
      )
      expect(screen.queryByRole("alertdialog")).toBeNull()
    })

    it("al guardar el certificado avisa si la sucursal tiene cambios sin guardar", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      await usuario.type(await screen.findByLabelText("Descripción"), " 2")
      await usuario.type(
        screen.getByLabelText("Descripción del certificado"),
        " 2"
      )
      await usuario.click(
        screen.getByRole("button", { name: "Guardar certificado" })
      )

      expect(
        await screen.findByRole("alertdialog", { name: "Cambios sin guardar" })
      ).toBeTruthy()
      expect(screen.getByLabelText("Ubicación").textContent).toBe(
        "/configuracion/sucursales/7"
      )
    })

    it("habilita Guardar cambios solo con cambios pendientes", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      const guardar = await screen.findByRole("button", {
        name: "Guardar cambios",
      })
      expect(guardar.hasAttribute("disabled")).toBe(true)

      await usuario.type(screen.getByLabelText("Descripción"), " 2")

      expect(guardar.hasAttribute("disabled")).toBe(false)
      expect(screen.getByText("Cambios sin guardar")).toBeTruthy()
    })

    it("pide confirmación al salir con cambios sin guardar", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      await usuario.type(await screen.findByLabelText("Descripción"), " 2")
      await usuario.click(screen.getByRole("button", { name: "Cancelar" }))

      const dialogo = await screen.findByRole("alertdialog", {
        name: "Cambios sin guardar",
      })
      expect(dialogo).toBeTruthy()
      await usuario.click(
        screen.getByRole("button", { name: "Salir sin guardar" })
      )

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Ubicación").textContent).toBe(
          "/configuracion/sucursales"
        )
      )
    })

    it("al guardar vuelve al listado con sus filtros, orden y página", async () => {
      const usuario = userEvent.setup()
      renderizar(DESDE_LISTADO)

      await usuario.type(await screen.findByLabelText("Descripción"), " 2")
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Ubicación").textContent).toBe(
          "/configuracion/sucursales?pagina=2&descri=nor"
        )
      )
      const put = fetchSimulado.mock.calls.find(
        ([url, init]) =>
          String(url) === "/api/v1/sucursales/7" && init?.method === "PUT"
      )
      expect(JSON.parse(String(put?.[1]?.body))).toMatchObject({
        descri: "Norte 2",
      })
    })

    it("al guardar avisa si el certificado tiene cambios sin guardar", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      await usuario.type(
        await screen.findByLabelText("Descripción del certificado"),
        " 2"
      )
      await usuario.type(screen.getByLabelText("Descripción"), " 2")
      await usuario.click(
        screen.getByRole("button", { name: "Guardar cambios" })
      )

      const dialogo = await screen.findByRole("alertdialog", {
        name: "Cambios sin guardar",
      })
      await usuario.click(
        within(dialogo).getByRole("button", { name: "Cancelar" })
      )

      // Permanece en la pantalla para guardar el certificado.
      await vi.waitFor(() =>
        expect(screen.queryByRole("alertdialog")).toBeNull()
      )
      expect(screen.getByLabelText("Ubicación").textContent).toBe(
        "/configuracion/sucursales/7"
      )
    })

    it("cancelar vuelve al listado con sus filtros", async () => {
      const usuario = userEvent.setup()
      renderizar(DESDE_LISTADO)

      await usuario.click(
        await screen.findByRole("button", { name: "Cancelar" })
      )

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Ubicación").textContent).toBe(
          "/configuracion/sucursales?pagina=2&descri=nor"
        )
      )
    })

    it("elimina la sucursal desde su pantalla y vuelve al listado", async () => {
      const usuario = userEvent.setup()
      renderizar("/configuracion/sucursales/7")

      await usuario.click(
        await screen.findByRole("button", { name: "Eliminar" })
      )
      const dialogo = await screen.findByRole("alertdialog", {
        name: "Eliminar sucursal",
      })
      await usuario.click(
        within(dialogo).getByRole("button", { name: "Eliminar" })
      )

      await vi.waitFor(() =>
        expect(screen.getByLabelText("Ubicación").textContent).toBe(
          "/configuracion/sucursales"
        )
      )
      expect(
        fetchSimulado.mock.calls.some(
          ([url, init]) =>
            String(url) === "/api/v1/sucursales/7" && init?.method === "DELETE"
        )
      ).toBe(true)
      // El detalle se marca inactivo en caché: no se vuelve a pedir.
      const lecturasDetalle = fetchSimulado.mock.calls.filter(
        ([url, init]) =>
          String(url) === "/api/v1/sucursales/7" && init?.method !== "DELETE"
      )
      expect(lecturasDetalle).toHaveLength(1)
    })
  })
})
