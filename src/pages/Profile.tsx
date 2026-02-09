import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Card } from '../components/Card'
import { FormInput } from '../components/FormInput'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../services/userService'
import { Pencil, Save, X } from 'lucide-react'

export const Profile = () => {
  const { user, profile, roles, refreshProfile } = useAuth()
  const role = roles[0] || 'patient'
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  /* ── Shared fields ── */
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')

  /* ── Patient-specific ── */
  const [bloodGroup, setBloodGroup] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')

  /* ── Doctor-specific ── */
  const [licenseNumber, setLicenseNumber] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [education, setEducation] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [hospitalAffiliation, setHospitalAffiliation] = useState('')

  /* ── Nurse-specific ── */
  const [nursingLicense, setNursingLicense] = useState('')
  const [department, setDepartment] = useState('')
  const [nurseSpecialization, setNurseSpecialization] = useState('')
  const [nurseExperience, setNurseExperience] = useState('')

  /* ── Load saved profile data ── */
  const loadProfileData = () => {
    let data: Record<string, unknown> = {}

    // Load from AuthContext profile
    if (profile) {
      data = { ...profile }
    }

    setFullName((data.full_name as string) ?? '')
    setPhone((data.phone as string) ?? '')
    setAddress((data.address as string) ?? '')
    setDateOfBirth((data.date_of_birth as string) ?? '')
    setGender((data.gender as string) ?? '')
    setBloodGroup((data.blood_group as string) ?? '')
    setEmergencyContact((data.emergency_contact as string) ?? '')
    setEmergencyPhone((data.emergency_phone as string) ?? '')
    setAllergies((data.allergies as string) ?? '')
    setMedicalHistory((data.medical_history as string) ?? '')
    setLicenseNumber((data.license_number as string) ?? '')
    setSpecialization((data.specialization as string) ?? '')
    setEducation((data.education as string) ?? '')
    setExperienceYears(String((data.experience_years as number) ?? ''))
    setHospitalAffiliation((data.hospital_affiliation as string) ?? '')
    setNursingLicense((data.nursing_license as string) ?? '')
    setDepartment((data.department as string) ?? '')
    setNurseSpecialization((data.specialization as string) ?? '')
    setNurseExperience(String((data.experience_years as number) ?? ''))
  }

  useEffect(() => { loadProfileData() }, [profile])

  const onSave = async () => {
    if (!fullName.trim()) { toast.error('Full name is required'); return }
    setLoading(true)

    const payload: Record<string, unknown> = {
      full_name: fullName, phone, address,
      date_of_birth: dateOfBirth, gender,
    }

    if (role === 'patient') {
      Object.assign(payload, { blood_group: bloodGroup, emergency_contact: emergencyContact, emergency_phone: emergencyPhone, allergies, medical_history: medicalHistory })
    }
    if (role === 'doctor') {
      Object.assign(payload, { license_number: licenseNumber, specialization, education, experience_years: parseInt(experienceYears) || 0, hospital_affiliation: hospitalAffiliation })
    }
    if (role === 'nurse') {
      Object.assign(payload, { nursing_license: nursingLicense, department, specialization: nurseSpecialization, experience_years: parseInt(nurseExperience) || 0 })
    }

    /* Save to Supabase */
    if (user) {
      const { error } = await updateUserProfile(user.id, payload)
      if (error) { toast.error('Failed to save profile'); setLoading(false); return }
    }

    await refreshProfile()
    setLoading(false)
    setEditing(false)
    toast.success('Profile updated successfully')
  }

  const onCancel = () => { loadProfileData(); setEditing(false) }

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  /* ── Read-only row ── */
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="mt-0.5 text-sm text-slate-200">{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">My Profile</h2>
          <p className="text-sm text-slate-400">Manage your <span className="text-primary">{roleLabel}</span> account details</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="primary-btn flex items-center gap-2">
            <Pencil size={14} /> Edit Profile
          </button>
        )}
      </div>

      {/* ── Personal Information ── */}
      <Card title="Personal Information">
        {editing ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Full Name" value={fullName} onChange={setFullName} />
            <FormInput label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
            <FormInput label="Date of Birth" type="date" value={dateOfBirth} onChange={setDateOfBirth} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Gender</label>
              <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-300">Address</label>
              <textarea className="input min-h-[60px] resize-y" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="Email" value={profile?.email ?? user?.email ?? ''} />
            <InfoRow label="Phone" value={phone} />
            <InfoRow label="Date of Birth" value={dateOfBirth} />
            <InfoRow label="Gender" value={gender} />
            <InfoRow label="Address" value={address} />
          </div>
        )}
      </Card>

      {/* ── Patient Medical Info ── */}
      {role === 'patient' && (
        <Card title="Medical Information">
          {editing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Blood Group</label>
                <select className="input" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <FormInput label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} />
              <FormInput label="Emergency Phone" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+91 91234 56789" />
              <FormInput label="Allergies" value={allergies} onChange={setAllergies} />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-300">Medical History</label>
                <textarea className="input min-h-[80px] resize-y" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Blood Group" value={bloodGroup} />
              <InfoRow label="Emergency Contact" value={emergencyContact} />
              <InfoRow label="Emergency Phone" value={emergencyPhone} />
              <InfoRow label="Allergies" value={allergies} />
              <InfoRow label="Medical History" value={medicalHistory} />
            </div>
          )}
        </Card>
      )}

      {/* ── Doctor Professional Details ── */}
      {role === 'doctor' && (
        <Card title="Professional Details">
          {editing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="License Number" value={licenseNumber} onChange={setLicenseNumber} />
              <FormInput label="Specialization" value={specialization} onChange={setSpecialization} />
              <FormInput label="Education" value={education} onChange={setEducation} />
              <FormInput label="Years of Experience" value={experienceYears} onChange={setExperienceYears} />
              <FormInput label="Hospital Affiliation" value={hospitalAffiliation} onChange={setHospitalAffiliation} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="License Number" value={licenseNumber} />
              <InfoRow label="Specialization" value={specialization} />
              <InfoRow label="Education" value={education} />
              <InfoRow label="Experience" value={experienceYears ? `${experienceYears} years` : ''} />
              <InfoRow label="Hospital Affiliation" value={hospitalAffiliation} />
            </div>
          )}
        </Card>
      )}

      {/* ── Nurse Professional Details ── */}
      {role === 'nurse' && (
        <Card title="Professional Details">
          {editing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Nursing License" value={nursingLicense} onChange={setNursingLicense} />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Department</label>
                <select className="input" value={department} onChange={e => setDepartment(e.target.value)}>
                  <option value="">Select</option>
                  {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency', 'ICU', 'General Ward', 'Surgery'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <FormInput label="Specialization" value={nurseSpecialization} onChange={setNurseSpecialization} />
              <FormInput label="Years of Experience" value={nurseExperience} onChange={setNurseExperience} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Nursing License" value={nursingLicense} />
              <InfoRow label="Department" value={department} />
              <InfoRow label="Specialization" value={nurseSpecialization} />
              <InfoRow label="Experience" value={nurseExperience ? `${nurseExperience} years` : ''} />
            </div>
          )}
        </Card>
      )}

      {/* ── Action buttons (edit mode) ── */}
      {editing && (
        <div className="flex gap-3">
          <button onClick={onSave} disabled={loading} className="primary-btn flex items-center gap-2">
            <Save size={14} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onCancel} className="rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800/60 transition flex items-center gap-2">
            <X size={14} /> Cancel
          </button>
        </div>
      )}
    </div>
  )
}
