import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, hasActiveCompany, setCompanyId } from '../lib/supabase'
import type { Company, CompanyUser } from '../lib/types'
import { useClientStore } from '../features/clients/store'
import { useInvoiceStore } from '../features/invoicing/store'
import { useQuoteStore } from '../features/quoting/store'
import { useInventoryStore } from '../features/inventory/store'
import { useAppointmentStore } from '../features/scheduling/store'
import { useSettingsStore } from '../features/settings/store'
import { useConnectivityStore } from '../lib/connectivity'

// ── Legacy localStorage cleanup ──────────────────────────────────────────
// Clears all electrogestor-* keys except the theme.
function clearLegacyStorage(): void {
  const prefix = 'electrogestor-'
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key?.startsWith(prefix) && key !== 'electrogestor-theme') {
      localStorage.removeItem(key)
    }
  }
}

// ── Load all stores from Supabase after auth ──────────────────────────────
async function loadAllFromSupabase(): Promise<void> {
  if (!hasActiveCompany()) return

  try {
    await Promise.all([
      useClientStore.getState().loadAll(),
      useInvoiceStore.getState().loadAll(),
      useQuoteStore.getState().loadAll(),
      useInventoryStore.getState().loadAll(),
      useAppointmentStore.getState().loadAll(),
      useSettingsStore.getState().loadAll(),
    ])

    const anyFailed =
      !useClientStore.getState().loaded ||
      !useInvoiceStore.getState().loaded ||
      !useQuoteStore.getState().loaded ||
      !useInventoryStore.getState().loaded ||
      !useAppointmentStore.getState().loaded ||
      !useSettingsStore.getState().loaded

    useConnectivityStore.getState().setOnline(!anyFailed)
  } catch (err) {
    console.error('Error al cargar datos desde Supabase:', err)
    useConnectivityStore.getState().setOnline(false)
  }
}

interface AuthState {
  user: User | null
  company: Company | null
  companyUser: CompanyUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
  isRoot: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load the current user's company data ───────────────────────────────────
  const loadUserData = useCallback(async (userId: string, userEmail?: string) => {
    // 1. Try to find company_user by user_id (already linked)
    let { data: rows } = await supabase
      .from('company_users')
      .select('*, companies(*)')
      .eq('user_id', userId)

    // 2. If not found, try by email (admin added us before we signed up)
    if ((!rows || rows.length === 0) && userEmail) {
      const { data: emailRows } = await supabase
        .from('company_users')
        .select('*, companies(*)')
        .eq('email', userEmail)

      if (emailRows && emailRows.length > 0) {
        // Link to the real user_id (first time linking)
        for (const row of emailRows) {
          await supabase
            .from('company_users')
            .update({ user_id: userId })
            .eq('id', row.id)
        }
        rows = emailRows
      }
    }

    if (rows && rows.length > 0) {
      const row = rows[0] as any
      setCompanyUser({
        id: row.id,
        company_id: row.company_id,
        user_id: row.user_id,
        email: row.email,
        role: row.role,
        is_root: row.is_root,
        created_at: row.created_at,
      })
      const c: Company = {
        id: row.company_id,
        name: (row.companies as any)?.name ?? 'Mi Empresa',
        created_at: (row.companies as any)?.created_at ?? row.created_at,
      }
      setCompany(c)
      setCompanyId(c.id)
    } else {
      setCompanyUser(null)
      setCompany(null)
      setCompanyId(null)
    }
  }, [])

  // ── Initialize session ────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await loadUserData(currentUser.id, currentUser.email)
        loadAllFromSupabase()
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await loadUserData(currentUser.id, currentUser.email)
        loadAllFromSupabase()
      } else {
        setCompany(null)
        setCompanyUser(null)
        setCompanyId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserData])

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
    setCompanyId(null)
  }, [])

  const isAdmin = companyUser?.role === 'admin'
  const isRoot = companyUser?.is_root === true

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
        isRoot,
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

export { clearLegacyStorage }
