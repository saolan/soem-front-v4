import { Navigate, Outlet, useMatches } from "react-router"

import { mensajeDeError } from "@/compartido/api/errores"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CargandoPagina } from "@/compartido/componentes/CargandoPagina"
import { RUTA_INICIO } from "@/compartido/sesion/GuardasRuta"
import { rutaMenuDe } from "@/compartido/utilidades/rutasMenu"
import { useMenuSesion } from "@/modulos/seguridad/api/menu"
import { rutasDelMenu } from "@/modulos/seguridad/utilidades/menu"

/**
 * El menú decide qué pantallas se muestran: una página que no está en el
 * menú de la sesión (URL escrita a mano o cambio de sucursal) vuelve al
 * inicio. La autorización real la aplica el back-end.
 */
export function GuardaMenu() {
  const rutaMenu = rutaMenuDe(useMatches())
  const menu = useMenuSesion()

  if (rutaMenu === null) {
    return <Outlet />
  }
  if (menu.isPending) {
    return <CargandoPagina />
  }
  if (menu.isError) {
    return <AvisoError mensaje={mensajeDeError(menu.error)} />
  }
  if (!rutasDelMenu(menu.data).has(rutaMenu)) {
    return <Navigate to={RUTA_INICIO} replace />
  }
  return <Outlet />
}
