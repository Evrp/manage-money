import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser, Theme } from '@moneyflow/shared';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  themePreference: Theme | null;
  setAuth: (user: IUser, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<IUser>) => void;
  setThemePreference: (theme: Theme) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      themePreference: null,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedFields) => 
        set((state) => ({ 
          user: state.user ? { ...state.user, ...updatedFields } : null 
        })),
      setThemePreference: (theme) => set({ themePreference: theme }),
    }),
    {
      name: 'moneyflow-auth',
    }
  )
);
