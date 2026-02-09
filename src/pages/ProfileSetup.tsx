import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { FormInput } from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck } from 'lucide-react'

/* ──────────────────────────────────────────────
   Profile Setup — shown once after registration
   Fields differ per role (patient / doctor / nurse)
   ────────────────────────────────────────────── */

export const ProfileSetup = () => {
  const { user, profile, roles, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const role = roles[0] || 'patient'

  /* ── shared fields ── */
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? '')
  const [gender, setGender] = useState('')
  const [address, setAddress] = useState(profile?.address ?? '')

  /* ── patient-specific ── */
  const [bloodGroup, setBloodGroup] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')

  /* ── doctor-specific ── */
  const [licenseNumber, setLicenseNumber] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [education, setEducation] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [hospitalAffiliation, setHospitalAffiliation] = useState('')

  /* ── nurse-specific ── */
  const [nursingLicense, setNursingLicense] = useState('')
  const [department, setDepartment] = useState('')
  const [nurseSpecialization, setNurseSpecialization] = useState('')
  const [nurseExperience, setNurseExperience] = useState('')

  const [loading, setLoading] = useState(false)

  const onSave = async () => {
    if (!fullName.trim() || !phone.trim() || !dateOfBirth || !gender) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)

    /* Build profile payload */
    const payload: Record<string, unknown> = {
      full_name: fullName,
      phone,
      date_of_birth: dateOfBirth,
      gender,
      address,
      profile_completed: true,
    }

    if (role === 'patient') {
      payload.blood_group = bloodGroup
      payload.emergency_contact = emergencyContact
      payload.emergency_phone = emergencyPhone
      payload.allergies = allergies
      payload.medical_history = medicalHistory
    }
    if (role === 'doctor') {
      payload.license_number = licenseNumber
      payload.specialization = specialization
      payload.education = education
      payload.experience_years = parseInt(experienceYears) || 0
      payload.hospital_affiliation = hospitalAffiliation
    }
    if (role === 'nurse') {
      payload.nursing_license = nursingLicense
      payload.department = department
      payload.specialization = nurseSpecialization
      payload.experience_years = parseInt(nurseExperience) || 0
    }

    /* ── Save to Supabase ── */
    if (user) {
      const { updateUserProfile } = await import('../services/userService')
      const { error } = await updateUserProfile(user.id, payload)
      if (error) {
        toast.error('Failed to save profile')
        setLoading(false)
        return
      }
    }

    await refreshProfile()
    setLoading(false)
    toast.success('Profile completed successfully!')

    /* redirect to role dashboard */
    switch (role) {
      case 'admin':  navigate('/admin/dashboard', { replace: true }); break
      case 'doctor': navigate('/doctor/visits', { replace: true }); break
      case 'nurse':  navigate('/nurse/patients', { replace: true }); break
      default:       navigate('/consent', { replace: true })
    }
  }

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <ShieldCheck size={28} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Complete Your Profile</h1>
            <p className="mt-1 text-sm text-slate-400">
              Welcome! Please provide your details to set up your <span className="text-primary font-semibold">{roleLabel}</span> account.
            </p>
          </div>

          <div className="space-y-6">
            {/* ── Common Fields ── */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-blue-400 uppercase tracking-wider">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput label="Full Name *" value={fullName} onChange={setFullName} placeholder="Your full name" />
                <FormInput label="Phone Number *" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
                <FormInput label="Date of Birth *" type="date" value={dateOfBirth} onChange={setDateOfBirth} />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Gender *</label>
                  <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-slate-300">Address</label>
                <textarea
                  className="input min-h-[70px] resize-y"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="42, MG Road, Bengaluru, Karnataka"
                />
              </div>
            </div>

            {/* ── Patient Fields ── */}
            {role === 'patient' && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-emerald-400 uppercase tracking-wider">Medical Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Blood Group</label>
                    <select className="input" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <FormInput label="Emergency Contact Name" value={emergencyContact} onChange={setEmergencyContact} placeholder="Contact person" />
                  <FormInput label="Emergency Contact Phone" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+91 91234 56789" />
                  <FormInput label="Known Allergies" value={allergies} onChange={setAllergies} placeholder="e.g., Penicillin, Peanuts" />
                </div>
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-slate-300">Medical History</label>
                  <textarea
                    className="input min-h-[80px] resize-y"
                    value={medicalHistory}
                    onChange={e => setMedicalHistory(e.target.value)}
                    placeholder="Any pre-existing conditions, past surgeries, etc."
                  />
                </div>
              </div>
            )}

            {/* ── Doctor Fields ── */}
            {role === 'doctor' && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-blue-400 uppercase tracking-wider">Professional Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput label="Medical License Number *" value={licenseNumber} onChange={setLicenseNumber} placeholder="License #" />
                  <FormInput label="Specialization *" value={specialization} onChange={setSpecialization} placeholder="e.g., Cardiology" />
                  <FormInput label="Education / Qualification" value={education} onChange={setEducation} placeholder="e.g., MD Harvard" />
                  <FormInput label="Years of Experience" value={experienceYears} onChange={setExperienceYears} placeholder="e.g., 10" />
                  <FormInput label="Hospital Affiliation" value={hospitalAffiliation} onChange={setHospitalAffiliation} placeholder="Current hospital" />
                </div>
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-xs text-amber-300">
                    <strong>Note:</strong> Your account will be reviewed and approved by the administrator before you can access the full dashboard. You'll be notified once your request is accepted.
                  </p>
                </div>
              </div>
            )}

            {/* ── Nurse Fields ── */}
            {role === 'nurse' && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-green-400 uppercase tracking-wider">Professional Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput label="Nursing License Number *" value={nursingLicense} onChange={setNursingLicense} placeholder="License #" />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Department *</label>
                    <select className="input" value={department} onChange={e => setDepartment(e.target.value)}>
                      <option value="">Select department</option>
                      {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency', 'ICU', 'General Ward', 'Surgery'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <FormInput label="Specialization" value={nurseSpecialization} onChange={setNurseSpecialization} placeholder="e.g., Critical Care" />
                  <FormInput label="Years of Experience" value={nurseExperience} onChange={setNurseExperience} placeholder="e.g., 5" />
                </div>
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-xs text-amber-300">
                    <strong>Note:</strong> Your account will be reviewed and approved by the administrator before you can access the full dashboard. You'll be notified once your request is accepted.
                  </p>
                </div>
              </div>
            )}

            {/* ── Save Button ── */}
            <button
              onClick={onSave}
              disabled={loading}
              className="w-full rounded-lg bg-primary py-3 font-bold text-slate-950 hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Profile Setup'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
