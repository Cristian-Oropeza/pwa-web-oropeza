/**
 * Cliente HTTP del navegador. SIEMPRE llama a /api/proxy/... (nunca al backend
 * directo), para que el JWT viva solo en cookies httpOnly y la URL del backend
 * no se exponga al bundle del cliente.
 */

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: { codigo: number; mensaje: string; detalles?: unknown };
}

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export async function apiPost<T>(
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/proxy${path}`, {
      method: "POST",
      headers: { ...DEFAULT_HEADERS, ...extraHeaders },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      cache: "no-store",
    });

    const text = await res.text();
    const parsed = text ? safeJson(text) : undefined;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: parsed ?? {
          codigo: res.status,
          mensaje: res.statusText || "Error de comunicacion",
        },
      };
    }
    return { ok: true, status: res.status, data: parsed as T };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: {
        codigo: 0,
        mensaje: err instanceof Error ? err.message : "Error de red",
      },
    };
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
