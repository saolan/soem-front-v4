import { Component, type ErrorInfo, type ReactNode } from "react"

interface EstadoLimiteErrores {
  hayError: boolean
}

/**
 * Boundary global: captura errores fuera del router (proveedores) para que
 * la aplicación no quede en blanco.
 */
export class LimiteErrores extends Component<
  { children: ReactNode },
  EstadoLimiteErrores
> {
  state: EstadoLimiteErrores = { hayError: false }

  static getDerivedStateFromError(): EstadoLimiteErrores {
    return { hayError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.hayError) {
      return (
        <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
          <h1 className="text-2xl font-semibold">
            Ocurrió un error inesperado
          </h1>
          <p className="text-muted-foreground">
            Recargue la página. Si el problema persiste, contacte al
            administrador.
          </p>
        </main>
      )
    }
    return this.props.children
  }
}
