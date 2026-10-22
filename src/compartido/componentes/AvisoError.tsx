import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert"

/** Mensaje general de error de una operación (anunciado con role="alert"). */
export function AvisoError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) {
    return null
  }
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertDescription>{mensaje}</AlertDescription>
    </Alert>
  )
}
