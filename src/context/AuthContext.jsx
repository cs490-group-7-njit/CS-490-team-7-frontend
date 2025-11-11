import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginUser, registerUser } from '../api/auth'
const AuthContext = createContext(null)
const STORAGE_KEY = 'salonhub.auth'

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { user: null, token: null, lastActivity: null }

    try {
      const parsed = JSON.parse(stored)
      
      // Check if the session is older than 24 hours (86400000 ms)
      const sessionTimeout = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      const now = Date.now()
      
      if (parsed.lastActivity && (now - parsed.lastActivity) > sessionTimeout) {
        console.log('Session expired, clearing stored auth')
        localStorage.removeItem(STORAGE_KEY)
        return { user: null, token: null, lastActivity: null }
      }
      
      // Update last activity to current time
      const refreshedState = { ...parsed, lastActivity: now }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedState))
      return refreshedState
    } catch (error) {
      console.warn('Failed to parse auth storage', error)
      localStorage.removeItem(STORAGE_KEY)
      return { user: null, token: null, lastActivity: null }
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const login = useCallback(async (credentials) => {
    const result = await loginUser(credentials)
    const newState = { 
      user: result.user, 
      token: result.token, 
      lastActivity: Date.now() 
    }
    setState(newState)
    return result
  }, [])

  const register = useCallback(async (userData) => {
    const result = await registerUser(userData)
    const newState = { 
      user: result.user, 
      token: result.token || 'dummy-token', // Some registration APIs might not return a token
      lastActivity: Date.now() 
    }
    setState(newState)
    return result
  }, [])

  const logout = useCallback(() => {
    setState({ user: null, token: null, lastActivity: null })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Function to refresh user activity (extend session)
  const refreshActivity = useCallback(() => {
    if (state.user && state.token) {
      setState(prev => ({ ...prev, lastActivity: Date.now() }))
    }
  }, [state.user, state.token])

  const setUser = useCallback((updatedUser) => {
    setState(prev => ({
      ...prev,
      user: updatedUser,
      lastActivity: Date.now()
    }))
  }, [])

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      isAuthenticated: Boolean(state.user && state.token),
      login,
      register,
      logout,
      refreshActivity,
      setUser,
    }),
    [state, login, register, logout, refreshActivity, setUser],
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
