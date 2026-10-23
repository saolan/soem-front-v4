import { useLocation } from "react-router"

/** Pantalla provisional de las páginas del menú aún no implementadas. */
export function PaginaEnConstruccion() {
  const { pathname } = useLocation()

  return (
    <section className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">
        Pantalla en construcción
      </h1>
      <p className="text-muted-foreground">
        La pantalla <code>{pathname}</code> todavía no está disponible.
      </p>
    </section>
  )
}
