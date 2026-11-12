// Hasta 6 decimales: la escala máxima de los BigDecimal del back-end.
const formatoDecimalEc = new Intl.NumberFormat("es-EC", {
  maximumFractionDigits: 6,
})

/**
 * Muestra un decimal recibido como string (BigDecimal). Solo da formato: el
 * front no hace aritmética con importes ni cantidades. Si el texto no es un
 * decimal válido se devuelve tal cual.
 */
export function formatoDecimal(valor: string): string {
  if (!/^-?\d+(\.\d+)?$/.test(valor)) {
    return valor
  }
  // `format` acepta el string decimal sin pasarlo por `number` (sin perder
  // precisión); TypeScript aún no lo declara.
  return formatoDecimalEc.format(valor as unknown as number)
}
