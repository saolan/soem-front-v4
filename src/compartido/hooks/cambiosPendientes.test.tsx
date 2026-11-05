import { act, cleanup, render, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import {
  useCambiosPendientes,
  usePublicarCambiosPendientes,
} from "@/compartido/hooks/cambiosPendientes"

function Publicador({ id, lista }: { id: string; lista: string[] }) {
  usePublicarCambiosPendientes(id, lista)
  return null
}

describe("cambiosPendientes", () => {
  afterEach(() => {
    cleanup()
  })

  it("reúne los cambios de las páginas montadas sin repetir", () => {
    const { result } = renderHook(() => useCambiosPendientes())

    render(
      <>
        <Publicador id="a" lista={["los datos de la sucursal"]} />
        <Publicador
          id="b"
          lista={["los datos de la sucursal", "el certificado"]}
        />
      </>
    )

    expect(result.current).toEqual([
      "los datos de la sucursal",
      "el certificado",
    ])
  })

  it("quita los cambios al guardarlos o al desmontar la página", () => {
    const { result } = renderHook(() => useCambiosPendientes())
    const vista = render(<Publicador id="a" lista={["el certificado"]} />)
    expect(result.current).toEqual(["el certificado"])

    vista.rerender(<Publicador id="a" lista={[]} />)
    expect(result.current).toEqual([])

    vista.rerender(<Publicador id="a" lista={["el certificado"]} />)
    act(() => vista.unmount())
    expect(result.current).toEqual([])
  })
})
