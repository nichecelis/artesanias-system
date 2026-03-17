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
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      usuario: null,

      setAuth: (token, refreshToken, usuario) => {
        console.log('✅ Auth guardado:', usuario.correo);
        set({ token, refreshToken, usuario });
      },

      setToken: (token) => {
        console.log('🔄 Token actualizado');
        set({ token });
      },

      logout: () => {
        console.log('🚪 Logout realizado');
        set({ token: null, refreshToken: null, usuario: null });
      },

      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: 'artesanias-auth', // Nombre en localStorage
    }
  )
);
