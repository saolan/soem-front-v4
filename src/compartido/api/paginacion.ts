// Único punto de conversión entre la paginación del API (`pagina` desde 1)
// y la de TanStack Table (`pageIndex` desde 0).

export const TAMANIOS_PAGINA = [10, 20, 50, 100] as const
export const TAMANIO_PAGINA_PREDETERMINADO = 20

export type Direccion = "asc" | "desc"

export function aPageIndex(pagina: number): number {
  return Math.max(pagina - 1, 0)
}

export function aPaginaApi(pageIndex: number): number {
  return Math.max(pageIndex, 0) + 1
}

export const PAGINAS_POR_BLOQUE = 5

/**
 * Números de página del bloque que contiene `pagina`, de `tamanioBloque` en
 * `tamanioBloque` (ej. página 7 de 12 → [6, 7, 8, 9, 10]; 12 → [11, 12]).
 */
export function paginasDelBloque(
  pagina: number,
  totalPaginas: number,
  tamanioBloque: number = PAGINAS_POR_BLOQUE
): number[] {
  const ultima = Math.max(totalPaginas, 1)
  const actual = Math.min(Math.max(pagina, 1), ultima)
  const inicio = Math.floor((actual - 1) / tamanioBloque) * tamanioBloque + 1
  const fin = Math.min(inicio + tamanioBloque - 1, ultima)
  return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i)
}
