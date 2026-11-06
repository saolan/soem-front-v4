import { LogoSoem } from "@/compartido/componentes/LogoSoem"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"

interface PropsPantallaAutenticacion {
  titulo: string
  /** Texto bajo el título (ej. aviso de clave caducada). */
  descripcion?: string
  /** Contenido sobre el título (ej. el usuario de la sesión). */
  encabezado?: React.ReactNode
  children: React.ReactNode
}

/** Pantalla centrada con el logo, para login y cambio de clave. */
export function PantallaAutenticacion({
  titulo,
  descripcion,
  encabezado,
  children,
}: PropsPantallaAutenticacion) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-linear-to-b from-muted to-background p-4 sm:p-6">
      <LogoSoem variante="destacada" />
      {/* Sin fondo ni borde propios: el formulario queda sobre el degradado. */}
      <Card className="w-full max-w-sm bg-transparent ring-0">
        <CardHeader className="text-center">
          {encabezado}
          <CardTitle className="text-xl">
            <h1>{titulo}</h1>
          </CardTitle>
          {descripcion && (
            <CardDescription className="text-balance">
              {descripcion}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}
