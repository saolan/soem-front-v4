import { isRouteErrorResponse, Link, useRouteError } from "react-router"

import { Button } from "@/compartido/componentes/ui/button"
import { RUTA_INICIO } from "@/compartido/sesion/GuardasRuta"

/** `errorElement` del router: rutas inexistentes y errores de renderizado. */
export function PaginaError() {
  const error = useRouteError()
  const noEncontrada = isRouteErrorResponse(error) && error.status === 404

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-semibold">
        {noEncontrada ? "Página no encontrada" : "Ocurrió un error inesperado"}
      </h1>
      <p className="text-muted-foreground">
        {noEncontrada
          ? "La dirección solicitada no existe."
          : "Intente nuevamente. Si el problema persiste, contacte al administrador."}
      </p>
      <Button render={<Link to={RUTA_INICIO} />} nativeButton={false}>
        Ir al inicio
      </Button>
    </main>
  )
}
