import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
import { Button } from "@/compartido/componentes/ui/button"
import { useCambiosPendientes } from "@/compartido/hooks/cambiosPendientes"
import {
  AVISO_PREVIO_SEGUNDOS,
  INACTIVIDAD_POR_DEFECTO_SEGUNDOS,
  useCierrePorInactividad,
} from "@/compartido/sesion/useCierrePorInactividad"
import { useSesion } from "@/compartido/sesion/useSesion"
import { unirConY } from "@/compartido/utilidades/texto"
import { useLogout } from "@/modulos/seguridad/api/autenticacion"

/**
 * Cierra la sesión tras un tiempo sin uso y avisa antes, con la opción de
 * seguir trabajando. Se monta una vez, dentro de `SesionProvider`.
 */
export function CierrePorInactividad() {
  const { estado, sesion } = useSesion()
  const logout = useLogout()
  const pendientes = useCambiosPendientes()
  const { segundosRestantes, continuar } = useCierrePorInactividad({
    activo: estado === "autenticado",
    inactividadSegundos:
      sesion?.inactividadSegundos ?? INACTIVIDAD_POR_DEFECTO_SEGUNDOS,
    avisoSegundos: AVISO_PREVIO_SEGUNDOS,
    marcaRenovacion: sesion,
    onVencer: () => {
      // useLogout cierra la sesión local aunque el servidor no responda.
      logout.mutate()
      if (pendientes.length > 0) {
        toast.warning(
          `Su sesión se cerró por inactividad. Se perdieron los cambios sin guardar en ${unirConY(pendientes)}.`
        )
      } else {
        toast.info("Su sesión se cerró por inactividad")
      }
    },
  })

  return (
    <AlertDialog
      open={segundosRestantes !== null}
      onOpenChange={(abierto) => {
        // Escape también cuenta como seguir trabajando.
        if (!abierto) {
          continuar()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Sigue ahí?</AlertDialogTitle>
          <AlertDialogDescription>
            Por inactividad, su sesión se cerrará en {segundosRestantes ?? 0}{" "}
            segundos.
            {pendientes.length > 0 && (
              <>
                {" "}
                <strong>
                  Tiene cambios sin guardar en {unirConY(pendientes)}
                </strong>
                , que se perderán si la sesión se cierra.
              </>
            )}{" "}
            ¿Desea continuar trabajando?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* No cierra el diálogo por sí mismo (eso equivale a continuar): al
              cerrar la sesión el diálogo desaparece. */}
          <Button
            variant="outline"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Cerrar sesión
          </Button>
          <AlertDialogAction onClick={continuar}>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
