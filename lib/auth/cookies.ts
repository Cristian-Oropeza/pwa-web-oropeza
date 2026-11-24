import { cookies } from "next/headers";

/** Nombres de las cookies de sesion. HttpOnly siempre, no legibles desde JS. */
export const COOKIE_ACCESS_TOKEN = "pwa_access_token";
export const COOKIE_PRE_AUTH_TOKEN = "pwa_pre_auth_token";
export const COOKIE_USER_INFO = "pwa_user_info"; // NO httpOnly, info publica del usuario

/** Opciones base para cookies httpOnly de sesion. */
const baseCookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/** Setea el access token (1 hora por defecto). */
export async function setAccessTokenCookie(token: string, expiraEnSeg: number) {
  const store = await cookies();
  store.set(COOKIE_ACCESS_TOKEN, token, {
    ...baseCookieOpts,
    maxAge: expiraEnSeg,
  });
  // Limpia el pre-auth al obtener el token real
  store.delete(COOKIE_PRE_AUTH_TOKEN);
}

/** Setea el pre-auth token (5 min por defecto). */
export async function setPreAuthTokenCookie(token: string, expiraEnSeg = 300) {
  const store = await cookies();
  store.set(COOKIE_PRE_AUTH_TOKEN, token, {
    ...baseCookieOpts,
    maxAge: expiraEnSeg,
  });
}

/** Info publica del usuario (correo, clienteId) - NO es httpOnly porque el UI la necesita. */
export async function setUserInfoCookie(info: { correo: string; clienteId: number }) {
  const store = await cookies();
  store.set(COOKIE_USER_INFO, JSON.stringify(info), {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(COOKIE_ACCESS_TOKEN);
  store.delete(COOKIE_PRE_AUTH_TOKEN);
  store.delete(COOKIE_USER_INFO);
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_ACCESS_TOKEN)?.value ?? null;
}

export async function getPreAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_PRE_AUTH_TOKEN)?.value ?? null;
}
