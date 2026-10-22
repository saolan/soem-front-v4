import { KeyRoundIcon, LogOutIcon, UserIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { Button } from "@/compartido/componentes/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import { RUTA_CAMBIO_CLAVE } from "@/compartido/sesion/GuardasRuta"
import { useSesion } from "@/compartido/sesion/useSesion"
import { useLogout } from "@/modulos/seguridad/api/autenticacion"

export function MenuUsuario() {
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const logout = useLogout()

  if (!sesion) {
    return null
  }

  const { usuari, nombre, apelli } = sesion.usuario
  const nombreCompleto = [nombre, apelli].filter(Boolean).join(" ")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" aria-label={`Menú de usuario ${usuari}`} />
        }
      >
        <UserIcon aria-hidden="true" />
        <span className="hidden truncate sm:inline">{usuari}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{nombreCompleto || usuari}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navegar(RUTA_CAMBIO_CLAVE)}>
          <KeyRoundIcon aria-hidden="true" />
          Cambiar clave
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOutIcon aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
