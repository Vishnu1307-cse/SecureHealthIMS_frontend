import toast from 'react-hot-toast'

export const handleSupabaseError = (error: { message?: string } | null, context: string) => {
  if (!error) return
  const message = error.message || 'Unexpected error'
  toast.error(`${context}: ${message}`)
}
