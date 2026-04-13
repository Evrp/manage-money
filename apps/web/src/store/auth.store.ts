import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@moneyflow/shared';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updatedFields) => 
        set((state) => ({ 
          user: state.user ? { ...state.user, ...updatedFields } : null 
        })),
    }),
    {
      name: 'moneyflow-auth',
    }
  )
);
