/**
 * Cache ligero de productos del catalogo. Lo llena la lista al consultar;
 * lo consume la vista detalle para evitar un roundtrip extra cuando el
 * usuario viene desde el listado. Si el detalle se abre con el store vacio
 * (deep link), el componente hace un fallback: consulta la primera pagina
 * amplia y encuentra el producto por id.
 *
 * No persistimos a localStorage a proposito: el catalogo cambia diario
 * por el scheduler y preferimos volver a pegarle al backend antes que
 * mostrar datos obsoletos.
 */
"use client";

import { create } from "zustand";
import type { CatalogoProducto } from "@/lib/types";

interface CatalogoState {
  productos: Record<number, CatalogoProducto>;
  upsertMany: (lista: CatalogoProducto[]) => void;
  getById: (id: number) => CatalogoProducto | undefined;
  clear: () => void;
}

export const useCatalogoStore = create<CatalogoState>((set, get) => ({
  productos: {},
  upsertMany: (lista) =>
    set((s) => {
      const next = { ...s.productos };
      for (const p of lista) next[p.id] = p;
      return { productos: next };
    }),
  getById: (id) => get().productos[id],
  clear: () => set({ productos: {} }),
}));
