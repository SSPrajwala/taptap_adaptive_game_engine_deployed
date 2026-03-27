import React, { createContext, useContext, useState, useCallback } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:      string
  name:    string
  email:   string
  college: string
}

interface AuthState {
  user:  AuthUser | null
  token: string | null
}

interface AuthContextType extends AuthState {
  login:    (email: string, password: string) => Promise<{ error?: string }>
  register: (name: string, email: string, password: string, college: string) => Promise<{ error?: string }>
  logout:   () => void
  isLoggedIn: boolean
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

const API = "http://localhost:3001/api"

const STORAGE_KEY = "taptap_auth_v1"

function loadState(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { user: null, token: null }
  } catch {
    return { user: null, token: null }
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState)

  const persist = useCallback((next: AuthState) => {
    setState(next)
    try {
      if (next.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else           localStorage.removeItem(STORAGE_KEY)
    } catch { /* storage unavailable in private mode — safe to ignore */ }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error ?? "Login failed." }
      persist({ user: data.user, token: data.token })
      return {}
    } catch {
      return { error: "Cannot connect to server. Is the backend running?" }
    }
  }, [persist])

  const register = useCallback(async (
    name: string, email: string, password: string, college: string
  ): Promise<{ error?: string }> => {
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password, college }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error ?? "Registration failed." }
      persist({ user: data.user, token: data.token })
      return {}
    } catch {
      return { error: "Cannot connect to server. Is the backend running?" }
    }
  }, [persist])

  const logout = useCallback(() => {
    persist({ user: null, token: null })
  }, [persist])

  return (
    <AuthContext.Provider value={{
      ...state,
      isLoggedIn: state.user !== null,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/* eslint-disable-next-line react-refresh/only-export-components */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be called inside <AuthProvider>")
  return ctx
}
