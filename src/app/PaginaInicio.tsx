import { useSesion } from "@/compartido/sesion/useSesion"

export function PaginaInicio() {
  const { sesion } = useSesion()
  const nombre = sesion?.usuario.nombre ?? sesion?.usuario.usuari

  return (
    <section className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-semibold">
        Bienvenido{nombre ? `, ${nombre}` : ""}
      </h1>
      <p className="text-muted-foreground">
        Seleccione una opción del menú para comenzar.
      </p>
    </section>
  )
}
