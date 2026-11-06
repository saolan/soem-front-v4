import { CircleAlertIcon } from "lucide-react"
import { useEffect, useRef } from "react"

import { MARGEN_DESPLAZAMIENTO_CAMPO } from "@/compartido/componentes/clasesCampo"
import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert"

interface PropsAvisoError {
  mensaje: string | null
  /**
   * Lleva el foco y la vista al aviso cuando aparece (ej. error general al
   * guardar un formulario largo, con el botón al pie). No lo hace si el foco
   * ya está en un campo con error: ese campo es más útil para corregir.
   */
  enfocar?: boolean
}

/** Mensaje general de error de una operación (anunciado con role="alert"). */
export function AvisoError({ mensaje, enfocar = false }: PropsAvisoError) {
  const aviso = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const elemento = aviso.current
    if (!enfocar || !mensaje || !elemento) {
      return
    }
    const activo = document.activeElement
    if (activo?.getAttribute("aria-invalid") === "true") {
      return
    }
    elemento.focus()
  }, [enfocar, mensaje])

  if (!mensaje) {
    return null
  }
  return (
    <Alert
      ref={aviso}
      variant="destructive"
      // Enfocable solo por programa: no entra en el orden de tabulación.
      tabIndex={enfocar ? -1 : undefined}
      className={MARGEN_DESPLAZAMIENTO_CAMPO}
    >
      <CircleAlertIcon aria-hidden="true" />
      <AlertDescription>{mensaje}</AlertDescription>
    </Alert>
  )
}
