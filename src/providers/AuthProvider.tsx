import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Company, CompanyUser } from '../lib/types'

interface AuthState {
  user: User | null
  company: Company | null
  companyUser: CompanyUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load company info for the current user ─────────────────────────────────
  const loadCompanyInfo = useCallback(async (userId: string) => {
    const { data: cu } = await supabase
      .from('company_users')
      .select('*, companies(*)')
      .eq('user_id', userId)
      .single()

    if (cu) {
      setCompanyUser({
        id: cu.id,
        company_id: cu.company_id,
        user_id: cu.user_id,
        email: cu.email,
        role: cu.role,
        created_at: cu.created_at,
      })
      const comp = cu.companies as unknown as Company
      setCompany(comp)
    } else {
      setCompanyUser(null)
      setCompany(null)
    }
  }, [])

  // ── Initialize session ────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await loadCompanyInfo(currentUser.id)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await loadCompanyInfo(currentUser.id)
      } else {
        setCompany(null)
        setCompanyUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadCompanyInfo])

  // ── Sign in ────────────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/`
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
  }, [])

  // ── Sign out ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCompany(null)
    setCompanyUser(null)
  }, [])

  const isAdmin = companyUser?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        companyUser,
        loading,
        signInWithGoogle,
        signOut,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
