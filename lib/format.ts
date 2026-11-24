/**
 * Utilidades de formato. Se mantienen tolerantes a nulls y a valores
 * numericos serializados como string (BigDecimal del backend) para no
 * reventar la UI ante datos inesperados.
 */

type MaybeNumber = string | number | null | undefined;

/**
 * Convierte un valor posiblemente string/number/null en number finito.
 * Devuelve null si no se puede parsear.
 */
export function toFiniteNumber(v: MaybeNumber): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Formatea un monto en la moneda indicada (default MXN) con Intl.
 * Si el valor no es numerico devuelve "-".
 */
export function formatMoney(v: MaybeNumber, moneda: string | null | undefined = "MXN"): string {
  const n = toFiniteNumber(v);
  if (n === null) return "-";
  const currency = (moneda ?? "MXN").toUpperCase();
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    // Codigo de moneda invalido: cae a formateo plano.
    return `${n.toFixed(2)} ${currency}`;
  }
}

/** Formatea una fecha ISO-8601 en es-MX. Null -> "-". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
