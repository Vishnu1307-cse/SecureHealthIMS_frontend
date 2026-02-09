import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureUserProfile, fetchUserProfile } from '../services/userService'
import type { Role, UserProfile } from '../types'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  roles: Role[]
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const loadProfile = async (currentUser: User) => {
    try {
      const { data: profileData } = await fetchUserProfile(currentUser.id)

      if (profileData) {
        setProfile(profileData)
        const role = (profileData.role as Role) ?? 'patient'
        setRoles([role])
        return
      }

      const { data: ensured } = await ensureUserProfile(currentUser)
      if (ensured) {
        setProfile(ensured)
        setRoles([(ensured.role as Role) ?? 'patient'])
      } else {
        setProfile(null)
        setRoles(['patient'])
      }
    } catch {
      setProfile(null)
      setRoles(['patient'])
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user)
  }, [user])

  const signOut = useCallback(async () => {
    // Clear React state
    setSession(null)
    setUser(null)
    setProfile(null)
    setRoles([])

    // Tell Supabase to sign out
    await supabase.auth.signOut({ scope: 'local' })

    // 4. Nuke any leftover tokens
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
    if (url) {
      try {
        const ref = new URL(url).host.split('.')[0]
        const key = `sb-${ref}-auth-token`
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let skipNextAuthChange = false

    const initialize = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return

        if (data.session?.user) {
          setSession(data.session)
          setUser(data.session.user)
          skipNextAuthChange = true
          await loadProfile(data.session.user)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initialize()

    if (!isSupabaseConfigured) {
      return () => { mounted = false }
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      if (skipNextAuthChange) { skipNextAuthChange = false; return }

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        // fire-and-forget to keep it non-blocking
        loadProfile(newSession.user)
      } else {
        setProfile(null)
        setRoles([])
      }
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({ session, user, profile, roles, loading, signOut, refreshProfile }),
    [session, user, profile, roles, loading, signOut, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
