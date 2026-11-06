import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { usePublicarCambiosPendientes } from "@/compartido/hooks/cambiosPendientes"
import {
  ContextoSesion,
  type ValorSesion,
} from "@/compartido/sesion/ContextoSesion"
import { CierrePorInactividad } from "@/modulos/seguridad/componentes/CierrePorInactividad"

const MINUTO = 60_000

/** Página simulada con cambios sin guardar. */
function PaginaConCambios({ descripciones }: { descripciones: string[] }) {
  usePublicarCambiosPendientes("pagina", descripciones)
  return null
}

describe("CierrePorInactividad", () => {
  const fetchSimulado = vi.fn<typeof fetch>()
  let cerrarSesion: ReturnType<typeof vi.fn<() => void>>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal("fetch", fetchSimulado)
    fetchSimulado.mockResolvedValue(
      new Response(JSON.stringify({ exito: true, mensaje: "ok" }))
    )
    cerrarSesion = vi.fn<() => void>()
    const sesion: ValorSesion = {
      estado: "autenticado",
      sesion: {
        expiraEnSegundos: 900,
        sucursalId: 1,
        sucursales: [{ valor: 1, etiqueta: "Matriz" }],
        usuario: {
          cedulaRuc: "1",
          apelli: "Pérez",
          usuari: "aa",
          estado: true,
        },
        permisos: [],
        claveCaducada: false,
        // Valor enviado por el back-end: 10 minutos.
        inactividadSegundos: 600,
      },
      sucursalNoDisponible: false,
      iniciarSesion: vi.fn(),
      cerrarSesion,
    }
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ContextoSesion value={sesion}>
          <CierrePorInactividad />
        </ContextoSesion>
      </QueryClientProvider>
    )
  })

  afterEach(() => {
    cleanup()
    fetchSimulado.mockReset()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const avanzar = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })

  it("usa el tiempo de inactividad que envía el back-end y avisa antes", async () => {
    await avanzar(9 * MINUTO + 1_000)

    const dialogo = screen.getByRole("alertdialog", { name: "¿Sigue ahí?" })
    expect(dialogo.textContent).toContain(
      "Por inactividad, su sesión se cerrará en 59 segundos"
    )
  })

  it("sin cambios pendientes no menciona cambios sin guardar", async () => {
    await avanzar(9 * MINUTO + 1_000)

    const dialogo = screen.getByRole("alertdialog", { name: "¿Sigue ahí?" })
    expect(dialogo.textContent).not.toContain("cambios sin guardar")
  })

  it("advierte qué cambios sin guardar se perderían", async () => {
    render(
      <PaginaConCambios
        descripciones={[
          "los datos de la sucursal",
          "el certificado de firma electrónica",
        ]}
      />
    )
    await avanzar(9 * MINUTO + 1_000)

    const dialogo = screen.getByRole("alertdialog", { name: "¿Sigue ahí?" })
    expect(dialogo.textContent).toContain(
      "Tiene cambios sin guardar en los datos de la sucursal y el certificado de firma electrónica, que se perderán si la sesión se cierra."
    )
  })

  it("«Continuar» cierra el aviso y mantiene la sesión", async () => {
    await avanzar(9 * MINUTO + 30_000)

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))
    await avanzar(1_000)

    expect(screen.queryByRole("alertdialog")).toBeNull()
    await avanzar(9 * MINUTO)
    expect(cerrarSesion).not.toHaveBeenCalled()
  })

  it("al vencer revoca la sesión en el servidor y la cierra", async () => {
    await avanzar(10 * MINUTO + 1_000)

    const logout = fetchSimulado.mock.calls.find(([url]) =>
      String(url).endsWith("/auth/logout")
    )
    expect(logout?.[1]?.method).toBe("POST")
    expect(cerrarSesion).toHaveBeenCalledTimes(1)
  })
})
