const listaConjuncion = new Intl.ListFormat("es", { type: "conjunction" })

/** Une los elementos con comas e «y» (ej. "A, B y C"). */
export function unirConY(elementos: readonly string[]): string {
  return listaConjuncion.format(elementos)
}
