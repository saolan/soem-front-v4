import { use } from "react"

import { ContextoSesion } from "@/compartido/sesion/ContextoSesion"

export function useSesion() {
  const contexto = use(ContextoSesion)
  if (contexto === undefined) {
    throw new Error("useSesion debe usarse dentro de SesionProvider")
  }
  return contexto
}
