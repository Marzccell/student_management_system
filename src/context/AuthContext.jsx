/**
 * Auth Context
 * ==============
 * Provides authentication state and methods to the entire app.
 * Manages session persistence and real-time auth state changes.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigError } from '../lib/supabase'

const AuthContext = createContext({})

/**
 * useAuth hook — access auth state from any component
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * AuthProvider — wraps the app and provides auth state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (supabaseConfigError) {
      setLoading(false)
      return
    }

    // Get the current session on mount
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Sign up with email and password
   */
  const signUp = async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: supabaseConfigError } }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  /**
   * Sign in with email and password
   */
  const signIn = async (email, password) => {
    if (!supabase) {
      return { data: null, error: { message: supabaseConfigError } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    if (!supabase) {
      return { error: { message: supabaseConfigError } }
    }

    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    configError: supabaseConfigError,
    signUp,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
