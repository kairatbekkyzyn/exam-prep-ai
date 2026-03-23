import { create } from 'zustand'
import { authAPI } from '../api'

interface User {
  id: number; email: string; name: string; xp: number; streak_days: number
}

interface AuthState {
  user: User | null
  token: string | null
  theme: 'dark' | 'light'
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  updateXP: (xp: number) => void
  toggleTheme: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:  null,
  token: localStorage.getItem('token'),
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',

  login: async (email, password) => {
    const res   = await authAPI.login({ email, password })
    const token = res.data.access_token
    localStorage.setItem('token', token)
    set({ token })
    const me = await authAPI.me()
    set({ user: me.data })
  },

  register: async (name, email, password) => {
    await authAPI.register({ name, email, password })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const me = await authAPI.me()
      set({ user: me.data })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },

  updateXP: (xp) => set(s => ({ user: s.user ? { ...s.user, xp } : null })),

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    set({ theme: next })
    document.documentElement.setAttribute('data-theme', next)
  },
}))