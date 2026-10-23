import { mensajeDeError } from "@/compartido/api/errores"
import { AvisoError } from "@/compartido/componentes/AvisoError"
import { Button } from "@/compartido/componentes/ui/button"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { useMenuSesion } from "@/modulos/seguridad/api/menu"
import { ArbolMenu } from "@/modulos/seguridad/componentes/ArbolMenu"

/** Menú de la sesión con sus estados de carga, error y vacío. */
export function MenuLateral({ alNavegar }: { alNavegar?: () => void }) {
  const menu = useMenuSesion()

  return (
    <nav aria-label="Menú principal" className="flex flex-col gap-2">
      {menu.isPending ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          <span className="sr-only">Cargando menú…</span>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-7 w-4/5" />
        </div>
      ) : menu.isError ? (
        <>
          <AvisoError mensaje={mensajeDeError(menu.error)} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void menu.refetch()}
          >
            Reintentar
          </Button>
        </>
      ) : menu.data.length === 0 ? (
        <p className="px-2 text-sm text-muted-foreground">
          No hay opciones de menú disponibles.
        </p>
      ) : (
        <ArbolMenu nodos={menu.data} alNavegar={alNavegar} />
      )}
    </nav>
  )
}
