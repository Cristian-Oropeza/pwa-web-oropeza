"use client";

/**
 * Registra /sw.js una vez en el navegador. Solo corre en produccion para no
 * interferir con hot-reload en dev. Si el navegador no soporta service workers
 * (o estamos en HTTP plano fuera de localhost), simplemente no hace nada.
 */

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("SW register failed:", err);
        });
    };
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
