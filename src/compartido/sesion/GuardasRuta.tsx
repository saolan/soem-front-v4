import { Navigate, Outlet, useLocation, useSearchParams } from "react-router"

import { CargandoPagina } from "@/compartido/componentes/CargandoPagina"
import { useSesion } from "@/compartido/sesion/useSesion"

export const RUTA_INICIO = "/"
export const RUTA_LOGIN = "/login"
export const RUTA_CAMBIO_CLAVE = "/cambiar-clave"

/** Solo acepta rutas internas para evitar redirecciones abiertas. */
export function rutaDeRetorno(valor: string | null) {
  return valor?.startsWith("/") && !valor.startsWith("//") ? valor : RUTA_INICIO
}

/** Requiere sesión; con la clave caducada solo permite cambiarla. */
export function RutaProtegida() {
  const { estado, sesion } = useSesion()
  const ubicacion = useLocation()

  if (estado === "cargando") {
    return <CargandoPagina />
  }
  if (estado === "anonimo" || !sesion) {
    const retorno = `${ubicacion.pathname}${ubicacion.search}`
    return (
      <Navigate
        to={`${RUTA_LOGIN}?retorno=${encodeURIComponent(retorno)}`}
        replace
      />
    )
  }
  if (sesion.claveCaducada && ubicacion.pathname !== RUTA_CAMBIO_CLAVE) {
    return <Navigate to={RUTA_CAMBIO_CLAVE} replace />
  }
  return <Outlet />
}

/** Solo para usuarios sin sesión (login). */
export function RutaPublica() {
  const { estado } = useSesion()
  const [parametros] = useSearchParams()

  if (estado === "cargando") {
    return <CargandoPagina />
  }
  if (estado === "autenticado") {
    return <Navigate to={rutaDeRetorno(parametros.get("retorno"))} replace />
  }
  return <Outlet />
}
