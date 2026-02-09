import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { handleSupabaseError } from './errorHandler'
import { logAudit } from './auditService'
import type { Role } from '../types'

const inferRoleFromEmail = (email?: string | null): Role => {
  const value = (email || '').toLowerCase()
  if (value.includes('admin')) return 'admin'
  if (value.includes('doctor')) return 'doctor'
  if (value.includes('nurse')) return 'nurse'
  return 'patient'
}

const inferRoleFromUser = (user: User): Role => {
  const metaRole = (user.user_metadata?.role || user.app_metadata?.role) as Role | undefined
  return metaRole ?? inferRoleFromEmail(user.email)
}

export const ensureUserProfile = async (user: User) => {
  const role = inferRoleFromUser(user)
  const fullName =
    (user.user_metadata?.full_name as string | undefined) || user.email?.split('@')[0] || 'User'

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        user_id: user.id,
        email: user.email,
        full_name: fullName,
        role,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.warn('Unable to ensure user profile:', error.message)
  }

  return { data, error }
}

export const fetchUserProfile = async (userId: string) => {
  // SUPABASE TABLE: users
  // WHY: Fetch the user's profile for display/edit in Profile page.
  const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single()
  
  if (error) {
    console.warn('User profile not found:', error.message)
  }

  return { data, error }
}

export const updateUserProfile = async (userId: string, payload: Record<string, unknown>) => {
  // SUPABASE TABLE: users
  // WHY: Update profile fields (contact info, demographics, etc.).
  const { data, error } = await supabase.from('users').update(payload).eq('user_id', userId).select().single()
  handleSupabaseError(error, 'Profile update failed')

  if (!error) {
    await logAudit({ action: 'update_profile', tableName: 'users', recordId: userId, patientId: userId })
  }

  return { data, error }
}

export const fetchUserRoles = async (userId: string) => {
  // SUPABASE TABLE: users
  // WHY: Determine access permissions for RoleBasedRoute and sidebar.
  // Get role directly from users table
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    console.warn('User profile not found when fetching role:', error.message)
    return { data: [], error }
  }

  // Return array format to match expected structure
  return { data: data ? [{ role: data.role }] : [], error: null }
}

export const fetchAllUsers = async () => {
  // SUPABASE TABLE: users
  // WHY: Populate patient list and admin role management.
  const { data, error } = await supabase.from('users').select('*').order('full_name')
  handleSupabaseError(error, 'Users fetch failed')
  if (!error) {
    await logAudit({ action: 'read_users', tableName: 'users' })
  }
  return { data, error }
}

export const updateUserRole = async (userId: string, role: string) => {
  // SUPABASE TABLE: users
  // WHY: Admin role management updates role assignment.
  const { data, error } = await supabase.from('users').update({ role }).eq('user_id', userId).select()
  handleSupabaseError(error, 'Role update failed')
  if (!error) {
    await logAudit({ action: 'update_role', tableName: 'users', recordId: userId, patientId: userId })
  }
  return { data, error }
}
