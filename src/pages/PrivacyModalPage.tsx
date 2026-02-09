import { useState } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { acceptPrivacyTerms } from '../services/consentService'

export const PrivacyModalPage = () => {
  const { user } = useAuth()
  const [open, setOpen] = useState(true)

  const onAccept = async () => {
    if (!user) return
    const { error } = await acceptPrivacyTerms(user.id)
    if (!error) {
      toast.success('Privacy terms accepted')
      setOpen(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Privacy Terms"
      onClose={() => setOpen(false)}
      actions={<button className="primary-btn" onClick={onAccept}>Accept terms</button>}
    >
      <p className="text-sm text-slate-300">
        This application stores consent records and clinical data in a secure, HIPAA-aligned
        environment. Your acceptance enables care coordination and auditing.
      </p>
    </Modal>
  )
}
