import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_PRE_AUTH_TOKEN,
  setAccessTokenCookie,
  setPreAuthTokenCookie,
  setUserInfoCookie,
  clearSessionCookies,
} from "@/lib/auth/cookies";
import { cookies } from "next/headers";

/**
 * Proxy server-side: /api/proxy/<path> -> {BACKEND_URL}/<path>.
 * Agrega el Authorization header desde la cookie httpOnly (nunca viaja por el
 * cliente). Intercepta login y verificar-2FA para setear/limpiar cookies.
 */

const BACKEND = process.env.BACKEND_URL;
if (!BACKEND) {
  // Se valida en runtime en cada request, pero avisamos al arranque en dev.
  // No throw en top-level porque rompe el build.
  // eslint-disable-next-line no-console
  console.warn("BACKEND_URL no esta seteada en .env");
}

type Params = { path: string[] };

async function forward(req: NextRequest, params: Params): Promise<NextResponse> {
  if (!BACKEND) {
    return NextResponse.json(
      { codigo: 500, mensaje: "BACKEND_URL no configurada" },
      { status: 500 }
    );
  }

  const path = "/" + params.path.join("/");
  const targetUrl = `${BACKEND}${path}${req.nextUrl.search}`;

  // Headers: copia los safe, agrega Authorization si hay token.
  const headers = new Headers();
  const safeHeaders = ["content-type", "accept", "x-force-login", "x-request-id"];
  req.headers.forEach((v, k) => {
    if (safeHeaders.includes(k.toLowerCase())) headers.set(k, v);
  });

  const store = await cookies();
  const accessToken = store.get(COOKIE_ACCESS_TOKEN)?.value;
  const preAuthToken = store.get(COOKIE_PRE_AUTH_TOKEN)?.value;

  // Para endpoints de 2FA setup/activar/desactivar se usa el accessToken normal.
  // Para /auth/2fa/verificar, el preAuthToken va en el body (no en header).
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Body
  const body = req.method === "GET" || req.method === "HEAD"
    ? undefined
    : await req.text();

  // Si es /auth/2fa/verificar y no vino preAuthToken en el body, lo inyectamos desde la cookie.
  let finalBody = body;
  if (path === "/api/v1/auth/2fa/verificar" && body && preAuthToken) {
    try {
      const parsed = JSON.parse(body);
      if (!parsed.preAuthToken) {
        parsed.preAuthToken = preAuthToken;
        finalBody = JSON.stringify(parsed);
      }
    } catch { /* body no es JSON, dejar como esta */ }
  }

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: finalBody,
    cache: "no-store",
    redirect: "manual",
  });

  const resText = await upstream.text();
  const resJson = resText ? safeParse(resText) : undefined;

  // Si fue login o verificar-2FA exitoso, setear cookie segun el shape.
  if (upstream.ok && (path === "/api/v1/auth/login" || path === "/api/v1/auth/2fa/verificar")) {
    const r = resJson as {
      token?: string;
      expiraEn?: number;
      preAuthToken?: string;
      requiere2FA?: boolean;
      clienteId?: number;
      correo?: string;
    } | undefined;
    if (r?.token && r.expiraEn && r.clienteId && r.correo) {
      await setAccessTokenCookie(r.token, r.expiraEn);
      await setUserInfoCookie({ correo: r.correo, clienteId: r.clienteId });
      // No devolvemos el token al cliente - lo ocultamos de la respuesta
      const safeResponse = { ...r, token: undefined, preAuthToken: undefined };
      return NextResponse.json(safeResponse, { status: upstream.status });
    }
    if (r?.preAuthToken) {
      await setPreAuthTokenCookie(r.preAuthToken);
      const safeResponse = { ...r, preAuthToken: undefined };
      return NextResponse.json(safeResponse, { status: upstream.status });
    }
  }

  // Si fue logout, limpiar cookies del lado del navegador.
  if (upstream.ok && path === "/api/v1/auth/logout") {
    await clearSessionCookies();
  }

  // Default: devolver la respuesta tal cual (preservando status).
  const contentType = upstream.headers.get("content-type") ?? "application/json";
  return new NextResponse(resText, {
    status: upstream.status,
    headers: { "content-type": contentType },
  });
}

function safeParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return undefined; }
}

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  return forward(req, await ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<Params> }) {
  return forward(req, await ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<Params> }) {
  return forward(req, await ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<Params> }) {
  return forward(req, await ctx.params);
}
