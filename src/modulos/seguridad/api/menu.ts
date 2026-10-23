import { useQuery } from "@tanstack/react-query"
import { z } from "zod"

import { clienteHttp } from "@/compartido/api/clienteHttp"
import { useSesion } from "@/compartido/sesion/useSesion"
import { esquemaMenuNodoDTO } from "@/modulos/seguridad/esquemas/menu"

export const claveMenuSesion = ["sesion", "menu"] as const

export function obtenerMenu() {
  return clienteHttp("/auth/menu", { esquema: z.array(esquemaMenuNodoDTO) })
}

/**
 * Menú lateral de la sesión. Solo vive en el caché en memoria de TanStack
 * Query: se pide con cada sesión nueva (login, F5, cambio de sucursal o de
 * clave) y no se recarga al renovar el token. La clave incluye al usuario:
 * la cookie del refresh es una por navegador, así que una renovación puede
 * traer a otro usuario si inició sesión en otra pestaña.
 */
export function useMenuSesion() {
  const { sesion } = useSesion()
  return useQuery({
    queryKey: [
      ...claveMenuSesion,
      sesion?.usuario.usuari,
      sesion?.sucursalId,
      sesion?.claveCaducada,
    ],
    queryFn: obtenerMenu,
    select: (respuesta) => respuesta.datos,
    enabled: sesion !== null,
    staleTime: Infinity,
  })
}
