import { zodResolver } from "@hookform/resolvers/zod"
import { UserIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { aplicarErroresFormulario } from "@/compartido/api/aplicarErroresFormulario"
import { ErrorApi } from "@/compartido/api/errores"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { CampoSeleccion } from "@/compartido/componentes/CampoSeleccion"
import { Button } from "@/compartido/componentes/ui/button"
import { FieldGroup } from "@/compartido/componentes/ui/field"
import { leerUltimaSucursal } from "@/compartido/sesion/ultimaSucursal"
import { nombreVisible } from "@/compartido/sesion/nombreUsuario"
import { useSesion } from "@/compartido/sesion/useSesion"
import {
  useCambiarSucursal,
  useLogout,
} from "@/modulos/seguridad/api/autenticacion"
import {
  BOTON_AUTENTICACION,
  SELECCION_AUTENTICACION,
} from "@/modulos/seguridad/componentes/clasesAutenticacion"
import { PantallaAutenticacion } from "@/modulos/seguridad/componentes/PantallaAutenticacion"
import {
  esquemaSeleccionSucursal,
  type SeleccionSucursalFormulario,
} from "@/modulos/seguridad/esquemas/autenticacion"

/**
 * El usuario con varias sucursales elige en cuál trabajar antes de entrar
 * (sin sucursal la sesión no tiene permisos). Al confirmarla, RutaProtegida
 * lo lleva a la pantalla de retorno.
 */
export function PaginaSeleccionSucursal() {
  const { sesion, sucursalNoDisponible, cerrarSesion } = useSesion()
  const cambiarSucursal = useCambiarSucursal()
  const logout = useLogout()
  const [aviso, setAviso] = useState<string | null>(null)
  const sucursales = sesion?.sucursales ?? []
  // Preselección: la última sucursal usada en este navegador, si el usuario
  // aún tiene acceso a ella. Debe confirmarla igualmente.
  const ultima = leerUltimaSucursal()
  const formulario = useForm<SeleccionSucursalFormulario>({
    resolver: zodResolver(esquemaSeleccionSucursal),
    defaultValues: {
      sucursalId: sucursales.some((s) => s.valor === ultima) ? ultima : null,
    },
  })

  // El usuario llega desde el login: puede elegir directo con el teclado.
  useEffect(() => {
    formulario.setFocus("sucursalId")
  }, [formulario])

  const nombreCompleto = sesion ? nombreVisible(sesion.usuario) : ""

  const enviar = formulario.handleSubmit(async ({ sucursalId }) => {
    if (sucursalId === null) {
      return
    }
    setAviso(null)
    try {
      await cambiarSucursal.mutateAsync(sucursalId)
    } catch (error) {
      // Un 401 que sobrevive a la renovación: la sesión terminó.
      if (error instanceof ErrorApi && error.estado === 401) {
        cerrarSesion()
        return
      }
      // 400/422 (sin acceso a la sucursal) se refleja en el campo; red o
      // 5xx conservan la sesión y permiten reintentar.
      setAviso(
        aplicarErroresFormulario(error, formulario.setError, ["sucursalId"])
      )
    }
  })

  return (
    <PantallaAutenticacion
      titulo="Seleccione una sucursal"
      encabezado={
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <UserIcon aria-hidden="true" className="size-4" />
          {/* Contexto para el lector de pantalla, que lo lee antes del título. */}
          <span className="sr-only">Usuario:</span>
          {nombreCompleto}
        </p>
      }
      descripcion={
        sucursalNoDisponible
          ? "La sucursal en la que trabajaba ya no está disponible. Seleccione otra para continuar."
          : undefined
      }
    >
      <form onSubmit={enviar} noValidate>
        <FieldGroup>
          <AvisoError mensaje={aviso} enfocar />
          <CampoSeleccion
            control={formulario.control}
            name="sucursalId"
            etiqueta="Sucursal"
            opciones={sucursales}
            obligatorio
            className={SELECCION_AUTENTICACION}
          />
          <Button
            type="submit"
            className={BOTON_AUTENTICACION}
            disabled={cambiarSucursal.isPending || logout.isPending}
          >
            {cambiarSucursal.isPending ? "Ingresando…" : "Ingresar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No es usted?{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              disabled={cambiarSucursal.isPending || logout.isPending}
              onClick={() => logout.mutate()}
            >
              Cerrar sesión
            </Button>
          </p>
        </FieldGroup>
      </form>
    </PantallaAutenticacion>
  )
}
