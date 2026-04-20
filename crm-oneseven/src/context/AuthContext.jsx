import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const getUserName = () => {
    if (!user) return null
    const email = user.email || ''
    const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
    const firstName = name.split(' ')[0].toLowerCase()
    if (firstName === 'pablo' || email.includes('pablo')) return 'pablo'
    if (firstName === 'alberto' || email.includes('alberto')) return 'alberto'
    return firstName || 'pablo'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, getUserName }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
