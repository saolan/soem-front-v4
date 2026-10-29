import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"

interface PropsDialogoConfirmacion {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  titulo: string
  descripcion: React.ReactNode
  textoConfirmar: string
  /** Se deshabilitan los botones mientras la operación está en curso. */
  pendiente?: boolean
  onConfirmar: () => void
}

/** Confirmación explícita antes de eliminar, anular o desprocesar. */
export function DialogoConfirmacion({
  abierto,
  onAbiertoChange,
  titulo,
  descripcion,
  textoConfirmar,
  pendiente = false,
  onConfirmar,
}: PropsDialogoConfirmacion) {
  return (
    <AlertDialog open={abierto} onOpenChange={onAbiertoChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pendiente}
            onClick={onConfirmar}
          >
            {pendiente ? "Procesando…" : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
