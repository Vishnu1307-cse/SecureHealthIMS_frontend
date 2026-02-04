import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { Table } from '../components/Table'
import { fetchAllUsers, updateUserRole } from '../services/userService'

export const AdminRoleManagement = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await fetchAllUsers()
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const onRoleChange = async (userId: string, role: string) => {
    const { error } = await updateUserRole(userId, role)
    if (!error) {
      toast.success('Role updated')
    }
  }

  return (
    <Card title="Admin Role Management">
      {loading ? (
        <p className="text-sm text-slate-500">Loading users...</p>
      ) : (
        <Table
          headers={['Name', 'Email', 'Role']}
          rows={users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3">{u.full_name || 'N/A'}</td>
              <td className="px-4 py-3">{u.email || 'N/A'}</td>
              <td className="px-4 py-3">
                <select
                  className="input"
                  defaultValue={u.role || 'patient'}
                  onChange={(e) => onRoleChange(u.id, e.target.value)}
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        />
      )}
    </Card>
  )
}
