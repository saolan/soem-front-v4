import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"

interface PropsPantallaAutenticacion {
  titulo: string
  descripcion: string
  children: React.ReactNode
}

/** Tarjeta centrada para login y cambio de clave. */
export function PantallaAutenticacion({
  titulo,
  descripcion,
  children,
}: PropsPantallaAutenticacion) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>{titulo}</h1>
          </CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}
