import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erro ao carregar perfil:', error.message)
      setProfile(null)
      return null
    }

    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      if (active) setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession)
        await loadProfile(nextSession?.user?.id)
      },
    )

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateAuthError(error))
  }, [])

  const signUp = useCallback(async (nome, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })
    if (error) throw new Error(translateAuthError(error))

    // Se a confirmação de e-mail estiver desativada, já vem com sessão.
    // Caso contrário, avisamos que é preciso confirmar.
    return { needsConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(
    () => loadProfile(session?.user?.id),
    [loadProfile, session],
  )

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === 'admin',
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}

function translateAuthError(error) {
  const message = error.message || ''
  if (/invalid login credentials/i.test(message)) {
    return 'E-mail ou senha incorretos. Tente novamente.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).'
  }
  if (/user already registered/i.test(message)) {
    return 'Este e-mail já está cadastrado. Tente entrar.'
  }
  if (/password should be at least/i.test(message)) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  return message
}
