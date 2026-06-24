import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { supabase } from '../lib/supabase'
import { Card, CardHeader, CardBody } from '../shared/components/Card'
import { Button } from '../shared/components/Button'
import { Input } from '../shared/components/Input'
import { useToast } from '../shared/hooks/useToast'
import type { Company, CompanyUser } from '../lib/types'

export function AdminPage() {
  const { isAdmin, company } = useAuth()
  const { addToast } = useToast()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)

  // New user form
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee')
  const [adding, setAdding] = useState(false)

  // New company form (super admin only)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyEmail, setNewCompanyEmail] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    document.title = 'Admin | ElectroGestor'
  }, [])

  const fetchUsers = useCallback(async () => {
    if (!company) return
    setLoading(true)
    const { data } = await supabase
      .from('company_users')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true })
    if (data) setUsers(data as CompanyUser[])
    setLoading(false)
  }, [company])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ── Add user to current company ───────────────────────────────────────────
  const handleAddUser = useCallback(async () => {
    if (!company || !newEmail.trim()) return
    setAdding(true)

    // Check if the email exists in auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', newEmail.trim())

    // Note: 'users' view is not available directly; we use admin API instead.
    // Actually, Supabase exposes auth.users via a limited view.
    // Alternative: we add the user to company_users and let RLS handle it.
    // The user will get access when they log in.

    const { error } = await supabase.from('company_users').insert({
      company_id: company.id,
      user_id: 'pending', // We'll update this when the user signs in
      email: newEmail.trim(),
      role: newRole,
    })

    if (error) {
      addToast(`Error al agregar usuario: ${error.message}`, 'error')
    } else {
      addToast(`Usuario ${newEmail.trim()} agregado como ${newRole === 'admin' ? 'admin' : 'empleado'}`, 'success')
      setNewEmail('')
      fetchUsers()
    }
    setAdding(false)
  }, [company, newEmail, newRole, addToast, fetchUsers])

  // ── Remove user ───────────────────────────────────────────────────────────
  const handleRemoveUser = useCallback(
    async (userId: string) => {
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('id', userId)
      if (error) {
        addToast(`Error al eliminar usuario: ${error.message}`, 'error')
      } else {
        addToast('Usuario eliminado', 'success')
        fetchUsers()
      }
    },
    [addToast, fetchUsers],
  )

  // ── Create new company ────────────────────────────────────────────────────
  const handleCreateCompany = useCallback(async () => {
    if (!newCompanyName.trim() || !newCompanyEmail.trim()) return
    setCreating(true)

    const { data: comp, error: compError } = await supabase
      .from('companies')
      .insert({ name: newCompanyName.trim() })
      .select()
      .single()

    if (compError || !comp) {
      addToast(`Error al crear empresa: ${compError?.message}`, 'error')
      setCreating(false)
      return
    }

    // Add the admin user
    const { error: userError } = await supabase.from('company_users').insert({
      company_id: comp.id,
      user_id: 'pending',
      email: newCompanyEmail.trim(),
      role: 'admin',
    })

    if (userError) {
      addToast(`Empresa creada pero error al agregar admin: ${userError.message}`, 'error')
    } else {
      addToast(`Empresa "${newCompanyName.trim()}" creada. El admin recibirá acceso al iniciar sesión.`, 'success')
      setNewCompanyName('')
      setNewCompanyEmail('')
    }
    setCreating(false)
  }, [newCompanyName, newCompanyEmail, addToast])

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Solo administradores pueden acceder a esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin</h2>

      {/* ── Current company info ─────────────────────────────────────────── */}
      <Card padding="lg">
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {company?.name ?? 'Mi empresa'}
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID: {company?.id}
          </p>
        </CardBody>
      </Card>

      {/* ── Users list ───────────────────────────────────────────────────── */}
      <Card padding="lg">
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Usuarios de la empresa
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Los usuarios se agregan por email. Al iniciar sesión con Google, obtendrán acceso automático.
          </p>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400">Sin usuarios todavía.</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-800"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {u.email}
                    </p>
                    <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {u.role === 'admin' ? 'Admin' : 'Empleado'}
                    </span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveUser(u.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Add user form ────────────────────────────────────────────────── */}
      <Card padding="lg">
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Agregar usuario
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <Input
                label="Email del usuario"
                placeholder="ej: empleado@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rol
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'employee')}
                className="block rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="employee">Empleado</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button onClick={handleAddUser} disabled={adding || !newEmail.trim()}>
              {adding ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ── Create new company (admin only) ──────────────────────────────── */}
      <Card padding="lg">
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Nueva empresa
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Creá una nueva empresa con su admin. El usuario recibirá acceso al iniciar sesión.
          </p>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <Input
                label="Nombre de la empresa"
                placeholder="Ej: Martín Servicios Eléctricos"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Email del admin"
                placeholder="Ej: martin@gmail.com"
                value={newCompanyEmail}
                onChange={(e) => setNewCompanyEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreateCompany}
              disabled={creating || !newCompanyName.trim() || !newCompanyEmail.trim()}
            >
              {creating ? 'Creando...' : 'Crear empresa'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
