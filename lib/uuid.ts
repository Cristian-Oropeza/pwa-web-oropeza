/**
 * Helper para UUID v4 robusto. Preferimos el nativo crypto.randomUUID()
 * cuando esta disponible (requiere HTTPS o localhost). Si no, caemos a un
 * RNG basado en crypto.getRandomValues (siempre disponible en navegadores
 * modernos). Esto evita romper la generacion de idempotencyKey en contextos
 * de pruebas donde randomUUID no esta expuesto.
 */

export function uuidv4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: 16 bytes aleatorios -> formato 8-4-4-4-12 con bits de version y variant.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // Version 4
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  // Variant 10xx
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex: string[] = [];
  for (const b of bytes) hex.push(b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}
