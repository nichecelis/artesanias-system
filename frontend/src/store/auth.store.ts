import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  setAuth: (token: string, refreshToken: string, usuario: Usuario) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      usuario: null,
      setAuth: (token, refreshToken, usuario) =>
        set({ token, refreshToken, usuario }),
      setToken: (token) => set({ token }),
      logout: () => set({ token: null, refreshToken: null, usuario: null }),
    }),
    { name: 'artesanias-auth' },
  ),
);
