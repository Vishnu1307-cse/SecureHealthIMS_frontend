import { supabase } from '../lib/supabaseClient'
import { handleSupabaseError } from './errorHandler'

export interface RegisterPayload {
  email: string
  password: string
  name: string
  role: 'patient' | 'doctor'
  date_of_birth: string
  gender: string
  phone: string
  address: string
}

const getStorageKey = () => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url) return null
  try {
    const host = new URL(url).host
    const ref = host.split('.')[0]
    return `sb-${ref}-auth-token`
  } catch {
    return null
  }
}

export const registerUser = async (payload: RegisterPayload) => {
  // SUPABASE AUTH: create user
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.name,
        role: payload.role,
        date_of_birth: payload.date_of_birth,
        gender: payload.gender,
        phone: payload.phone,
        address: payload.address,
      },
    },
  })

  handleSupabaseError(error, 'Registration failed')
  return { data, error }
}

export const loginUser = async (email: string, password: string) => {
  // SUPABASE AUTH: sign in
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  handleSupabaseError(error, 'Login failed')
  return { data, error }
}

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  handleSupabaseError(error, 'Logout failed')
  const storageKey = getStorageKey()
  if (storageKey) {
    try {
      localStorage.removeItem(storageKey)
      sessionStorage.removeItem(storageKey)
    } catch (storageError) {
      console.warn('Failed to clear auth storage:', storageError)
    }
  }
  return { error }
}
