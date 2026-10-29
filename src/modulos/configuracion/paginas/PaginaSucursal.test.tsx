import { cleanup, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

function renderizar(url: string) {
  return renderizarPagina({
    url,
    permisos: TODOS,
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
    ["Representante legal", "Ana Pérez"],
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
    expect(JSON.parse(String(init?.body))).toMatchObject({
      codigo: "001",
      matriz: false,
      nombreCome: null,
      estado: true,
    })
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

  it("avisa que la matriz actual dejará de serlo", async () => {
    fetchSimulado.mockImplementation(async (url) => {
      const ruta = String(url)
      if (ruta.endsWith("/certificado-emision")) return respuestaApi(null, 404)
      if (ruta.endsWith("/combo")) return respuestaApi([])
      return respuestaApi(sucursal)
    })
    const usuario = userEvent.setup()
    renderizar("/configuracion/sucursales/7")

    await usuario.click(await screen.findByRole("switch", { name: "Matriz" }))

    expect(
      screen.getByText("Al guardar, la sucursal matriz actual dejará de serlo.")
    ).toBeTruthy()
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
})
