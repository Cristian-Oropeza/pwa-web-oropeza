/**
 * Lector de cookies no-httpOnly del lado del cliente. Hoy solo lo usamos
 * para pwa_user_info (correo + clienteId), que el proxy setea al login
 * sin httpOnly a proposito para que el UI pueda leerla.
 *
 * El access token SI es httpOnly y nunca es accesible desde JS: no intentar
 * leerlo aqui.
 */
"use client";

const COOKIE_USER_INFO = "pwa_user_info";

export interface UserInfoCookie {
  correo: string;
  clienteId: number;
}

export function readUserInfoCookie(): UserInfoCookie | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_USER_INFO}=`));
  if (!raw) return null;
  const value = raw.substring(COOKIE_USER_INFO.length + 1);
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<UserInfoCookie>;
    if (
      typeof parsed.correo === "string" &&
      typeof parsed.clienteId === "number" &&
      Number.isInteger(parsed.clienteId)
    ) {
      return { correo: parsed.correo, clienteId: parsed.clienteId };
    }
    return null;
  } catch {
    return null;
  }
}
