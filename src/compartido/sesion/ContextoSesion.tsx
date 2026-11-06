import { useQueryClient } from "@tanstack/react-query"
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

import {
  clienteHttp,
  establecerToken,
  registrarManejadoresSesion,
  renovarSesion,
} from "@/compartido/api/clienteHttp"
import {
  abrirCanalSesion,
  type CanalSesion,
} from "@/compartido/sesion/canalSesion"
import {
  esquemaLoginRespuestaDTO,
  type LoginRespuestaDTO,
} from "@/compartido/sesion/esquemas"
import { guardarUltimaSucursal } from "@/compartido/sesion/ultimaSucursal"

export type EstadoSesion = "cargando" | "autenticado" | "anonimo"

// El access token no se guarda aquí: vive solo en memoria en clienteHttp.
export type DatosSesion = Omit<LoginRespuestaDTO, "accessToken">

export interface ValorSesion {
  estado: EstadoSesion
  sesion: DatosSesion | null
  /**
   * Una renovación dejó la sesión sin la sucursal en la que trabajaba (p. ej.
   * le quitaron el acceso): el selector debe avisarlo.
   */
  sucursalNoDisponible: boolean
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
  const canal = useRef<CanalSesion | null>(null)
  const usuarioActual = useRef<string | null>(null)
  const sucursalActual = useRef<number | null>(null)
  const [sucursalNoDisponible, setSucursalNoDisponible] = useState(false)

  // Versiones locales: solo cambian el estado de esta pestaña.
  const aplicarSesion = useCallback((respuesta: LoginRespuestaDTO) => {
    const { accessToken, ...datos } = respuesta
    establecerToken(accessToken)
    const mismoUsuario = usuarioActual.current === datos.usuario.usuari
    if (datos.sucursalId != null) {
      guardarUltimaSucursal(datos.sucursalId)
      setSucursalNoDisponible(false)
    } else if (
      datos.requiereSeleccionSucursal &&
      mismoUsuario &&
      sucursalActual.current !== null
    ) {
      // Trabajaba en una sucursal y la renovación ya no la trae.
      setSucursalNoDisponible(true)
    }
    usuarioActual.current = datos.usuario.usuari
    sucursalActual.current = datos.sucursalId ?? null
    setSesion(datos)
    setEstado("autenticado")
  }, [])

  const cerrarLocal = useCallback(() => {
    establecerToken(null)
    usuarioActual.current = null
    sucursalActual.current = null
    setSucursalNoDisponible(false)
    setSesion(null)
    setEstado("anonimo")
    queryClient.clear()
  }, [queryClient])

  // Login, cambio de sucursal y cambio de clave: las demás pestañas adoptan
  // la sesión nueva con su propio refresh.
  const iniciarSesion = useCallback(
    (respuesta: LoginRespuestaDTO) => {
      aplicarSesion(respuesta)
      canal.current?.anunciar({ tipo: "iniciada" })
    },
    [aplicarSesion]
  )

  const cerrarSesion = useCallback(() => {
    cerrarLocal()
    canal.current?.anunciar({ tipo: "cerrada" })
  }, [cerrarLocal])

  useEffect(() => {
    const desregistrar = registrarManejadoresSesion({
      // La renovación no se anuncia: si lo hiciera, las pestañas se
      // rebotarían los avisos entre sí.
      renovar: async () => {
        const { datos } = await refrescarSesion()
        aplicarSesion(datos)
        return true
      },
      alExpirar: () => {
        cerrarSesion()
        toast.error("Su sesión expiró, inicie sesión nuevamente")
      },
    })

    canal.current = abrirCanalSesion((evento) => {
      if (evento.tipo === "cerrada") {
        if (usuarioActual.current !== null) {
          cerrarLocal()
          toast.info("La sesión se cerró en otra pestaña")
        }
        return
      }
      const anterior = usuarioActual.current
      // Si la renovación falla por red o servidor ("fallida") se conserva la
      // sesión: la siguiente petición vuelve a renovar el token.
      void renovarSesion().then((renovacion) => {
        if (renovacion === "rechazada") {
          cerrarLocal()
        } else if (renovacion === "fallida") {
          return
        } else if (anterior !== usuarioActual.current) {
          // Lo que hay en caché pertenece al usuario anterior.
          queryClient.clear()
        } else {
          void queryClient.invalidateQueries()
        }
      })
    })

    // El access token se pierde al recargar: se recupera con la cookie del
    // refresh token. renovarSesion es single-flight, por lo que el doble
    // montaje de StrictMode no dispara dos refresh.
    void renovarSesion().then((renovacion) => {
      if (renovacion !== "renovada") {
        setEstado((actual) => (actual === "cargando" ? "anonimo" : actual))
      }
    })

    return () => {
      desregistrar()
      canal.current?.cerrar()
      canal.current = null
    }
  }, [aplicarSesion, cerrarLocal, cerrarSesion, queryClient])

  const valor = useMemo(
    () => ({
      estado,
      sesion,
      sucursalNoDisponible,
      iniciarSesion,
      cerrarSesion,
    }),
    [estado, sesion, sucursalNoDisponible, iniciarSesion, cerrarSesion]
  )

  return <ContextoSesion value={valor}>{children}</ContextoSesion>
}
