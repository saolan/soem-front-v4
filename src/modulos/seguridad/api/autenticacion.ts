import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { clienteHttp } from "@/compartido/api/clienteHttp"
import { esquemaLoginRespuestaDTO } from "@/compartido/sesion/esquemas"
import { useSesion } from "@/compartido/sesion/useSesion"
import type {
  CambioClave,
  LoginRequest,
} from "@/modulos/seguridad/esquemas/autenticacion"

export function login(datos: LoginRequest) {
  return clienteHttp("/auth/login", {
    metodo: "POST",
    cuerpo: datos,
    esquema: esquemaLoginRespuestaDTO,
  })
}

export function logout() {
  return clienteHttp("/auth/logout", { metodo: "POST", esquema: z.null() })
}

// Sin la cookie de la sesión actual, el back-end cierra la sesión y no
// devuelve datos (AuthControlador#cambiarClave).
export function cambiarClave({ claveActual, claveNueva }: CambioClave) {
  return clienteHttp("/auth/cambiar-clave", {
    metodo: "POST",
    cuerpo: { claveActual, claveNueva },
    esquema: esquemaLoginRespuestaDTO.nullable(),
  })
}

export function cambiarSucursal(sucursalId: number) {
  return clienteHttp("/auth/cambiar-sucursal", {
    metodo: "POST",
    cuerpo: { sucursalId },
    esquema: esquemaLoginRespuestaDTO,
  })
}

export function useLogin() {
  const { iniciarSesion } = useSesion()
  return useMutation({
    mutationFn: login,
    onSuccess: ({ datos }) => iniciarSesion(datos),
  })
}

export function useLogout() {
  const { cerrarSesion } = useSesion()
  return useMutation({
    mutationFn: logout,
    // La sesión local se cierra aunque el servidor no responda.
    onSettled: () => cerrarSesion(),
  })
}

export function useCambiarClave() {
  const { iniciarSesion, cerrarSesion } = useSesion()
  return useMutation({
    mutationFn: cambiarClave,
    onSuccess: ({ datos }) => {
      if (datos) {
        iniciarSesion(datos)
      } else {
        cerrarSesion()
      }
    },
  })
}

export function useCambiarSucursal() {
  const { iniciarSesion } = useSesion()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cambiarSucursal,
    onSuccess: ({ datos }) => {
      iniciarSesion(datos)
      // Los datos en caché pertenecen a la sucursal anterior.
      void queryClient.invalidateQueries()
    },
  })
}
