import { NextRequest, NextResponse } from "next/server";

/**
 * Proteccion de rutas client-side. Si el usuario intenta entrar a /dashboard
 * sin cookie de acceso, lo manda a /login. Si ya tiene cookie de acceso y
 * va a /login, lo manda a /dashboard. El middleware no valida la firma del
 * JWT (eso lo hace el backend); solo verifica presencia.
 */

const COOKIE_ACCESS_TOKEN = "pwa_access_token";
const COOKIE_PRE_AUTH_TOKEN = "pwa_pre_auth_token";

const PUBLIC_PATHS = ["/login"];
const TWO_FA_PATH = "/2fa/verificar";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAccess = Boolean(req.cookies.get(COOKIE_ACCESS_TOKEN)?.value);
  const hasPreAuth = Boolean(req.cookies.get(COOKIE_PRE_AUTH_TOKEN)?.value);

  // /2fa/verificar solo accesible con preAuthToken
  if (pathname === TWO_FA_PATH) {
    if (!hasPreAuth && !hasAccess) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // /login: si ya esta autenticado, redirect al dashboard
  if (PUBLIC_PATHS.includes(pathname)) {
    if (hasAccess) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  // Resto de rutas: requiere acceso
  if (!hasAccess) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

// Excluye rutas internas, estaticos, y el proxy (que maneja sus propias cookies)
export const config = {
  matcher: [
    "/((?!api/proxy|_next/static|_next/image|favicon.ico|manifest.json).*)",
  ],
};
