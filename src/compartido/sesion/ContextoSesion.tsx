import { useQueryClient } from "@tanstack/react-query"
import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  clienteHttp,
  establecerToken,
  registrarManejadoresSesion,
  renovarSesion,
} from "@/compartido/api/clienteHttp"
import {
  esquemaLoginRespuestaDTO,
  type LoginRespuestaDTO,
} from "@/compartido/sesion/esquemas"

export type EstadoSesion = "cargando" | "autenticado" | "anonimo"

// El access token no se guarda aquí: vive solo en memoria en clienteHttp.
export type DatosSesion = Omit<LoginRespuestaDTO, "accessToken">

export interface ValorSesion {
  estado: EstadoSesion
  sesion: DatosSesion | null
  iniciarSesion: (respuesta: LoginRespuestaDTO) => void
  cerrarSesion: () => void
}

export const ContextoSesion = createContext<ValorSesion | undefined>(undefined)

function refrescarSesion() {
  return clienteHttp("/auth/refresh", {
    metodo: "POST",
    esquema: esquemaLoginRespuestaDTO,
  })
}

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [estado, setEstado] = useState<EstadoSesion>("cargando")
  const [sesion, setSesion] = useState<DatosSesion | null>(null)

  const iniciarSesion = useCallback((respuesta: LoginRespuestaDTO) => {
    const { accessToken, ...datos } = respuesta
    establecerToken(accessToken)
    setSesion(datos)
    setEstado("autenticado")
  }, [])

  const cerrarSesion = useCallback(() => {
    establecerToken(null)
    setSesion(null)
    setEstado("anonimo")
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    const desregistrar = registrarManejadoresSesion({
      renovar: async () => {
        const { datos } = await refrescarSesion()
        iniciarSesion(datos)
        return true
      },
      alExpirar: () => {
        cerrarSesion()
        toast.error("Su sesión expiró, inicie sesión nuevamente")
      },
    })

    // El access token se pierde al recargar: se recupera con la cookie del
    // refresh token. renovarSesion es single-flight, por lo que el doble
    // montaje de StrictMode no dispara dos refresh.
    void renovarSesion().then((renovada) => {
      if (!renovada) {
        setEstado((actual) => (actual === "cargando" ? "anonimo" : actual))
      }
    })

    return desregistrar
  }, [iniciarSesion, cerrarSesion])

  const valor = useMemo(
    () => ({ estado, sesion, iniciarSesion, cerrarSesion }),
    [estado, sesion, iniciarSesion, cerrarSesion]
  )

  return <ContextoSesion value={valor}>{children}</ContextoSesion>
}
