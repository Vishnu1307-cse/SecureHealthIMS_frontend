import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { fetchConsent, updateConsent } from '../services/consentService'
import { ShieldCheck, ShieldOff, Heart, Lock, UserCheck, AlertTriangle, Info, Database } from 'lucide-react'

export const ConsentDashboard = () => {
  const { user, profile } = useAuth()
  const [hasConsent, setHasConsent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)

  const userId = user?.id || (profile as Record<string, unknown>)?.id as string || 'unknown'

  const load = async () => {
    try {
      const { data, error } = await fetchConsent(userId)
      if (!error && data) {
        setHasConsent(!!data.has_consented)
      } else {
        setHasConsent(false)
      }
    } catch {
      // If backend is unreachable, default to no consent
      setHasConsent(false)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const onGrantConsent = async () => {
    setActionLoading(true)
    try {
      const { error } = await updateConsent(userId, true)
      if (error) {
        toast.error('Failed to grant consent. Please try again.')
      } else {
        setHasConsent(true)
        toast.success('Consent granted — your details are now visible to your care team.')
      }
    } catch {
      toast.error('Failed to grant consent. Please try again.')
    }
    setActionLoading(false)
  }

  const onRevokeConsent = async () => {
    setActionLoading(true)
    try {
      const { error } = await updateConsent(userId, false)
      if (error) {
        toast.error('Failed to revoke consent. Please try again.')
      } else {
        setHasConsent(false)
        toast.success('Consent revoked — your details are now hidden from doctors and nurses.')
      }
    } catch {
      toast.error('Failed to revoke consent. Please try again.')
    }
    setShowRevokeConfirm(false)
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* ── Hero Section ── */}
      <div className="rounded-xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-slate-900 to-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Heart size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Your Privacy, Your Choice</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              At <span className="font-semibold text-primary">Medos Hospital</span>, we believe you should be in complete control of your medical information. 
              This page lets you decide who can see your health records. Your consent matters — it's the foundation of trust between you and your care providers.
            </p>
          </div>
        </div>
      </div>

      {/* ── Data Ownership Notice ── */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <Database size={18} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">Your Data, Your Ownership</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              All medical records, visit history, prescriptions, and personal information displayed in this system
              belong exclusively to you, the patient. Medos Hospital acts only as a custodian of this data to facilitate
              your care. You have the right to access, control, and revoke access to your information at any time.
              No clinical staff can view your records without your explicit consent.
            </p>
          </div>
        </div>
      </div>

      {/* ── Why We Ask ── */}
      <Card title="Why Do We Need Your Consent?">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-300">
            Your medical records contain sensitive information — from your personal details to medical history, prescriptions, and visit records. 
            We ask for your consent because:
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-white/[0.02] p-4">
              <Lock size={18} className="mt-0.5 shrink-0 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Data Protection</p>
                <p className="text-xs text-slate-400">Your data remains private until you explicitly allow access. No one can view it without your permission.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-white/[0.02] p-4">
              <UserCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Better Care Quality</p>
                <p className="text-xs text-slate-400">When doctors can see your medical history, they provide more accurate diagnoses and avoid harmful drug interactions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-white/[0.02] p-4">
              <Heart size={18} className="mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Appointment Booking</p>
                <p className="text-xs text-slate-400">Consent is required to book appointments. Doctors need access to your records to prepare for your visit.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-white/[0.02] p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-violet-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Full Control</p>
                <p className="text-xs text-slate-400">You can revoke access at any time. Once revoked, doctors and nurses will no longer be able to see your details.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Important Notice ── */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Important Notice</p>
            <ul className="mt-1 list-disc pl-4 text-xs leading-relaxed text-amber-200/80">
              <li>Without granting consent, you <strong>cannot book appointments</strong> with any doctor.</li>
              <li>If you revoke consent, your name and details will be <strong>hidden from doctors and nurses</strong> in the patient list.</li>
              <li>The hospital administration retains a record for legal and safety purposes, but clinical staff will not have access.</li>
              <li>You can change your consent status at any time from this page.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Consent Status & Action ── */}
      <Card title="Your Consent Status">
        {loading ? (
          <p className="text-sm text-slate-400">Loading consent status...</p>
        ) : (
          <div className="space-y-5">
            {/* Status indicator */}
            <div className={`flex items-center gap-4 rounded-xl border p-5 ${
              hasConsent
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-red-500/30 bg-red-500/5'
            }`}>
              {hasConsent ? (
                <ShieldCheck size={32} className="text-emerald-400" />
              ) : (
                <ShieldOff size={32} className="text-red-400" />
              )}
              <div>
                <p className="text-lg font-bold text-slate-100">
                  {hasConsent ? 'Consent Granted' : 'Consent Not Granted'}
                </p>
                <p className="text-sm text-slate-400">
                  {hasConsent
                    ? 'Your medical records are accessible to your assigned doctors and nursing staff for care purposes.'
                    : 'Your medical records are currently private. Doctors and nurses cannot view your details.'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {!hasConsent ? (
                <>
                  <button
                    onClick={() => setShowTerms(true)}
                    disabled={actionLoading}
                    className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-500 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <ShieldCheck size={16} /> Grant Consent
                  </button>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Info size={13} /> You'll be shown the terms before granting access.
                  </p>
                </>
              ) : (
                <button
                  onClick={() => setShowRevokeConfirm(true)}
                  disabled={actionLoading}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-2.5 font-semibold text-red-400 hover:bg-red-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldOff size={16} /> Remove Access
                </button>
              )}
            </div>

            {hasConsent && (
              <div className="rounded-lg border border-slate-800/60 bg-white/[0.02] px-4 py-3">
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">What happens when you remove access?</strong>
                  <br />
                  Your profile and medical records will be hidden from all doctors and nurses. You will not appear in the patient list. 
                  However, the hospital administration retains your records for regulatory compliance. You can re-grant access at any time.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Grant Consent Modal (Terms) ── */}
      <Modal
        open={showTerms}
        title="Consent Agreement"
        onClose={() => setShowTerms(false)}
        actions={
          <div className="flex gap-3">
            <button onClick={() => setShowTerms(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition">
              Cancel
            </button>
            <button
              onClick={() => { setShowTerms(false); onGrantConsent() }}
              disabled={actionLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {actionLoading ? 'Granting...' : 'I Agree — Grant Consent'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-300">
          <p>By granting consent, you agree to the following:</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-400">
            <li>Your assigned doctors and nursing staff will be able to view your medical records, including personal details, medical history, prescriptions, and visit notes.</li>
            <li>This information will only be used for providing you with proper medical care and treatment coordination.</li>
            <li>Hospital administrators may access your records for administrative and regulatory purposes.</li>
            <li>You can revoke this consent at any time from the Consent page in your dashboard.</li>
            <li>Upon revocation, clinical staff will immediately lose access to your records.</li>
          </ul>
          <p className="font-semibold text-slate-200">
            Your privacy is our priority. We follow all applicable data protection regulations.
          </p>
        </div>
      </Modal>

      {/* ── Revoke Confirmation Modal ── */}
      <Modal
        open={showRevokeConfirm}
        title="Confirm Access Removal"
        onClose={() => setShowRevokeConfirm(false)}
        actions={
          <div className="flex gap-3">
            <button onClick={() => setShowRevokeConfirm(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition">
              Keep Access
            </button>
            <button
              onClick={onRevokeConsent}
              disabled={actionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-50"
            >
              {actionLoading ? 'Revoking...' : 'Yes, Remove Access'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-300">
          <p>Are you sure you want to remove access to your medical records?</p>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-amber-300">
              <strong>After revoking access:</strong>
            </p>
            <ul className="mt-1 list-disc pl-4 text-xs text-amber-200/80">
              <li>Doctors and nurses will no longer see your details</li>
              <li>You will not appear in the patient list for clinical staff</li>
              <li>You will not be able to book new appointments until you re-grant consent</li>
              <li>Administrative records will be maintained for compliance</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  )
}
