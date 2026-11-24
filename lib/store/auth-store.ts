"use client";

import { create } from "zustand";

interface UserInfo { correo: string; clienteId: number; }

interface AuthState {
  user: UserInfo | null;
  requiere2FA: boolean;
  setUser: (u: UserInfo | null) => void;
  setRequiere2FA: (v: boolean) => void;
  clear: () => void;
}

/**
 * Estado del cliente para datos no-sensibles del usuario. El JWT NO vive aqui;
 * vive en cookie httpOnly. Esta store sirve para el UI (mostrar correo, flag de 2FA).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  requiere2FA: false,
  setUser: (u) => set({ user: u }),
  setRequiere2FA: (v) => set({ requiere2FA: v }),
  clear: () => set({ user: null, requiere2FA: false }),
}));
