import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginVendor } from '../api/auth'
const AuthContext = createContext(null)
const STORAGE_KEY = 'salonhub.auth'

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { user: null, token: null }

    try {
      return JSON.parse(stored)
    } catch (error) {
      console.warn('Failed to parse auth storage', error)
      return { user: null, token: null }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const login = useCallback(async (credentials) => {
    const result = await loginVendor(credentials)
    setState({ user: result.user, token: result.token })
    return result
  }, [])

  const logout = useCallback(() => {
    setState({ user: null, token: null })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      isAuthenticated: Boolean(state.user && state.token),
      login,
      logout,
    }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
