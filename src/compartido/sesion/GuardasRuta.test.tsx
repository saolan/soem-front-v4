import { cleanup, render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Ubicacion } from "@/compartido/pruebas/renderizarPagina"
import {
  ContextoSesion,
  type DatosSesion,
} from "@/compartido/sesion/ContextoSesion"
import {
  RUTA_CAMBIO_CLAVE,
  RUTA_SELECCION_SUCURSAL,
  RutaProtegida,
} from "@/compartido/sesion/GuardasRuta"

function sesion(cambios: Partial<DatosSesion>): DatosSesion {
  return {
    expiraEnSegundos: 900,
    sucursalId: null,
    sucursales: [
      { valor: 1, etiqueta: "Matriz" },
      { valor: 2, etiqueta: "Norte" },
    ],
    usuario: { cedulaRuc: "1", apelli: "Pérez", usuari: "aa", estado: true },
    permisos: [],
    claveCaducada: false,
    requiereSeleccionSucursal: true,
    ...cambios,
  }
}

function renderizar(datos: DatosSesion, url: string) {
  const router = createMemoryRouter(
    [
      {
        element: <RutaProtegida />,
        children: [
          { path: "/", element: <Ubicacion /> },
          { path: "/configuracion", element: <Ubicacion /> },
          { path: RUTA_CAMBIO_CLAVE, element: <Ubicacion /> },
          { path: RUTA_SELECCION_SUCURSAL, element: <Ubicacion /> },
        ],
      },
    ],
    { initialEntries: [url] }
  )
  render(
    <ContextoSesion
      value={{
        estado: "autenticado",
        sesion: datos,
        sucursalNoDisponible: false,
        iniciarSesion: vi.fn(),
        cerrarSesion: vi.fn(),
      }}
    >
      <RouterProvider router={router} />
    </ContextoSesion>
  )
}

const ubicacion = () => screen.getByLabelText("Ubicación").textContent

describe("RutaProtegida: selección de sucursal", () => {
  afterEach(() => {
    cleanup()
  })

  it("sin sucursal elegida lleva al selector conservando la ruta de retorno", () => {
    renderizar(sesion({}), "/configuracion?pagina=2")

    expect(ubicacion()).toBe(
      `${RUTA_SELECCION_SUCURSAL}?retorno=${encodeURIComponent("/configuracion?pagina=2")}`
    )
  })

  it("con la clave caducada pide primero cambiar la clave", () => {
    renderizar(sesion({ claveCaducada: true }), RUTA_SELECCION_SUCURSAL)

    expect(ubicacion()).toBe(RUTA_CAMBIO_CLAVE)
  })

  it("después de cambiar la clave lleva al selector y luego al inicio", () => {
    renderizar(sesion({}), RUTA_CAMBIO_CLAVE)

    expect(ubicacion()).toBe(
      `${RUTA_SELECCION_SUCURSAL}?retorno=${encodeURIComponent("/")}`
    )
  })

  it("con la sucursal elegida el selector vuelve a la ruta de retorno", () => {
    renderizar(
      sesion({ sucursalId: 2, requiereSeleccionSucursal: false }),
      `${RUTA_SELECCION_SUCURSAL}?retorno=${encodeURIComponent("/configuracion")}`
    )

    expect(ubicacion()).toBe("/configuracion")
  })

  it("con una sola sucursal entra directo", () => {
    renderizar(
      sesion({ sucursalId: 1, requiereSeleccionSucursal: false }),
      "/configuracion"
    )

    expect(ubicacion()).toBe("/configuracion")
  })
})
