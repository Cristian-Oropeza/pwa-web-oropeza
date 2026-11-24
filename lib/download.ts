"use client";

/**
 * Descarga una cadena como archivo en el navegador. Usado para los scratch
 * codes del 2FA: el usuario los baja como .txt y los guarda offline.
 */
export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke despues de un pequenio delay para que Safari alcance a disparar la descarga
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
