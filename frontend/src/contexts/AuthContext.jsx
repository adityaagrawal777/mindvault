import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)

  // Set token on axios whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token)
      api.setAuthToken(token)
    } else {
      localStorage.removeItem('auth_token')
      api.setAuthToken(null)
    }
  }, [token])

  // Auto-check token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        api.setAuthToken(token)
        const userData = await api.getMe()
        setUser(userData)
      } catch {
        // Token invalid/expired
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await api.login(username, password)
    setToken(res.token)
    setUser(res.user)
    return res
  }, [])

  const register = useCallback(async (username, password) => {
    const res = await api.register(username, password)
    setToken(res.token)
    setUser(res.user)
    return res
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
