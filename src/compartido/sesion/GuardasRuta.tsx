import { Navigate, Outlet, useLocation, useSearchParams } from "react-router"

import { CargandoPagina } from "@/compartido/componentes/CargandoPagina"
import { useSesion } from "@/compartido/sesion/useSesion"

export const RUTA_INICIO = "/"
export const RUTA_LOGIN = "/login"
export const RUTA_CAMBIO_CLAVE = "/cambiar-clave"
export const RUTA_SELECCION_SUCURSAL = "/seleccionar-sucursal"

/** Solo acepta rutas internas para evitar redirecciones abiertas. */
export function rutaDeRetorno(valor: string | null) {
  return valor?.startsWith("/") && !valor.startsWith("//") ? valor : RUTA_INICIO
}

/**
 * Requiere sesión. Con la clave caducada solo permite cambiarla; después, si
 * el usuario tiene varias sucursales y no eligió una, solo permite
 * seleccionarla (sin sucursal la sesión no tiene permisos).
 */
export function RutaProtegida() {
  const { estado, sesion } = useSesion()
  const ubicacion = useLocation()
  const [parametros] = useSearchParams()

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
  if (sesion.claveCaducada) {
    return ubicacion.pathname === RUTA_CAMBIO_CLAVE ? (
      <Outlet />
    ) : (
      <Navigate to={RUTA_CAMBIO_CLAVE} replace />
    )
  }
  const enSeleccion = ubicacion.pathname === RUTA_SELECCION_SUCURSAL
  if (sesion.requiereSeleccionSucursal && !enSeleccion) {
    // Se vuelve a la pantalla en la que estaba tras elegir la sucursal.
    const retorno =
      ubicacion.pathname === RUTA_CAMBIO_CLAVE
        ? RUTA_INICIO
        : `${ubicacion.pathname}${ubicacion.search}`
    return (
      <Navigate
        to={`${RUTA_SELECCION_SUCURSAL}?retorno=${encodeURIComponent(retorno)}`}
        replace
      />
    )
  }
  if (!sesion.requiereSeleccionSucursal && enSeleccion) {
    return <Navigate to={rutaDeRetorno(parametros.get("retorno"))} replace />
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
