import { Skeleton } from "@/compartido/componentes/ui/skeleton"

export function CargandoPagina() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex w-full max-w-md flex-col gap-3 p-6"
    >
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}
