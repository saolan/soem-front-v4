import { Badge } from "@/compartido/componentes/ui/badge"

/** Textos de un valor booleano sí/no (ej. `matriz`, `obligaCont`). */
export const TEXTO_SI_NO = { si: "Sí", no: "No" } as const

/**
 * Valor sí/no con el mismo formato que `EtiquetaEstado`. "Sí" no usa el color
 * de éxito: un booleano no es bueno ni malo por estar marcado.
 */
export function EtiquetaSiNo({ valor }: { valor: boolean }) {
  return valor ? (
    <Badge variant="secondary">{TEXTO_SI_NO.si}</Badge>
  ) : (
    <Badge variant="outline">{TEXTO_SI_NO.no}</Badge>
  )
}
