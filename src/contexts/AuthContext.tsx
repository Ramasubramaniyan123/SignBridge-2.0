import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, signIn, signUp, signOut, resendConfirmationEmail, signInWithGoogle as googleSignIn, signInWithPhone, verifyPhoneOTP, signInWithMagicLink } from '../lib/supabase'
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js'

interface User {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

interface Session {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>
  verifyPhoneOTP: (phone: string, token: string) => Promise<{ error: Error | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
}

// Helper functions to convert between Supabase types and local types
const convertSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    user_metadata: supabaseUser.user_metadata as Record<string, unknown>
  }
}

const convertSupabaseSession = (supabaseSession: SupabaseSession | null): Session | null => {
  if (!supabaseSession) return null
  return {
    user: convertSupabaseUser(supabaseSession.user)!,
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token,
    expires_at: supabaseSession.expires_at!
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(convertSupabaseSession(session))
      setUser(convertSupabaseUser(session?.user ?? null))
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(convertSupabaseSession(session))
        setUser(convertSupabaseUser(session?.user ?? null))
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      const { error } = await signUp(email, password, fullName)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await resendConfirmationEmail(email)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await googleSignIn()
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSignIn = async (phone: string) => {
    setLoading(true)
    try {
      const { error } = await signInWithPhone(phone)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPhoneOTP = async (phone: string, token: string) => {
    setLoading(true)
    try {
      const { error } = await verifyPhoneOTP(phone, token)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkSignIn = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await signInWithMagicLink(email)
      return { error }
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resendConfirmation: handleResendConfirmation,
    signInWithGoogle: handleGoogleSignIn,
    signInWithPhone: handlePhoneSignIn,
    verifyPhoneOTP: handleVerifyPhoneOTP,
    signInWithMagicLink: handleMagicLinkSignIn
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
