import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setAccessToken, getAccessToken, ApiClientError } from './client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  twoFactorEnabled: boolean
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string, totpCode?: string) => Promise<{ requiresTwoFactor?: boolean }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount — try to restore session
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      api.auth.me()
        .then(res => setUser(res.data as User))
        .catch(() => {
          setAccessToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, totpCode?: string) => {
    const res = await api.auth.login(email, password, totpCode)

    if (res.data.requiresTwoFactor) {
      return { requiresTwoFactor: true }
    }

    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken)
      const me = await api.auth.me()
      setUser(me.data as User)
    }

    return {}
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch {
      // ignore
    }
    setAccessToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const me = await api.auth.me()
      setUser(me.data as User)
    } catch {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
