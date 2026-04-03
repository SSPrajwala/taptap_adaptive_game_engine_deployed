import React, { createContext, useContext, useState, useCallback } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id?:            string
  college?:       string | null
  branch?:        string | null
  targetCompany?: string | null
  campusYear?:    string | null
  avatarUrl?:     string | null
}

export interface AuthUser {
  id:       string
  username: string
  email:    string
  role:     "user" | "admin"
  profile?: UserProfile | null
}

interface AuthState {
  user:  AuthUser | null
  token: string | null
}

interface RegisterInput {
  name:          string
  email:         string
  password:      string
  college?:      string
  branch?:       string
  targetCompany?: string
}

interface AuthContextType extends AuthState {
  login:         (email: string, password: string) => Promise<{ error?: string }>
  register:      (input: RegisterInput) => Promise<{ error?: string }>
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>
  logout:        () => void
  isLoggedIn:    boolean
  /** Convenience: college from profile */
  college:       string
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

const API          = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api"
const STORAGE_KEY  = "taptap_auth_v2"

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
      return { error: "Cannot connect to server. Please try again." }
    }
  }, [persist])

  const register = useCallback(async (input: RegisterInput): Promise<{ error?: string }> => {
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error ?? "Registration failed." }
      persist({ user: data.user, token: data.token })
      return {}
    } catch {
      return { error: "Cannot connect to server. Please try again." }
    }
  }, [persist])

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<{ error?: string }> => {
    if (!state.token) return { error: "Not logged in." }
    try {
      const res  = await fetch(`${API}/auth/profile`, {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.token}`,
        },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) return { error: json.error ?? "Profile update failed." }

      // Update local user object with new profile data
      if (state.user) {
        persist({
          token: state.token,
          user:  { ...state.user, profile: { ...(state.user.profile ?? {}), ...json.profile } },
        })
      }
      return {}
    } catch {
      return { error: "Cannot connect to server. Please try again." }
    }
  }, [state, persist])

  const logout = useCallback(() => {
    persist({ user: null, token: null })
  }, [persist])

  const college = state.user?.profile?.college ?? ""

  return (
    <AuthContext.Provider value={{
      ...state,
      isLoggedIn: state.user !== null,
      login, register, updateProfile, logout,
      college,
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
