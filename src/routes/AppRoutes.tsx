import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { RoleBasedRoute } from '../guards/RoleBasedRoute'
import { ConsentGuard } from '../guards/ConsentGuard'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { ForgotPassword } from '../pages/ForgotPassword'
import { Profile } from '../pages/Profile'
import { AdminRoleManagement } from '../pages/AdminRoleManagement'
import { ConsentDashboard } from '../pages/ConsentDashboard'
import { ConsentHistory } from '../pages/ConsentHistory'
import { PrivacyModalPage } from '../pages/PrivacyModalPage'
import { DoctorVisitEntry } from '../pages/DoctorVisitEntry'
import { PrescriptionEntry } from '../pages/PrescriptionEntry'
import { PatientHistory } from '../pages/PatientHistory'
import { PatientPrescriptions } from '../pages/PatientPrescriptions'
import { PatientAccessLogs } from '../pages/PatientAccessLogs'
import { AdminAuditDashboard } from '../pages/AdminAuditDashboard'
import { NursePatients } from '../pages/NursePatients'
import { DashboardHome } from '../pages/DashboardHome'
import { ComingSoon } from '../pages/ComingSoon'
import { ProfileSetup } from '../pages/ProfileSetup'

/* ── admin pages ── */
import { AdminDashboardHome } from '../pages/admin/AdminDashboardHome'
import { AdminAppointments } from '../pages/admin/AdminAppointments'
import { AdminDoctors } from '../pages/admin/AdminDoctors'
import { AdminPatients } from '../pages/admin/AdminPatients'
import { AdminBilling } from '../pages/admin/AdminBilling'
import { AdminLaboratory } from '../pages/admin/AdminLaboratory'
import { AdminDepartments } from '../pages/admin/AdminDepartments'
import { AdminServices } from '../pages/admin/AdminServices'
import { AdminReports } from '../pages/admin/AdminReports'
import { AdminNurses } from '../pages/admin/AdminNurses'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        {/* Profile setup — shown after first registration */}
        <Route path="/profile-setup" element={<ProfileSetup />} />

        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coming-soon" element={<ComingSoon />} />

          <Route element={<RoleBasedRoute allowedRoles={['patient']} />}>
            <Route path="/consent" element={<ConsentDashboard />} />
            <Route path="/consent/history" element={<ConsentHistory />} />
            <Route path="/privacy" element={<PrivacyModalPage />} />
            <Route path="/access-logs" element={<PatientAccessLogs />} />
          </Route>

          <Route element={<ConsentGuard />}>
            <Route element={<RoleBasedRoute allowedRoles={['patient', 'doctor', 'nurse']} />}>
              <Route path="/history" element={<PatientHistory />} />
              <Route path="/prescriptions" element={<PatientPrescriptions />} />
            </Route>
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor/visits" element={<DoctorVisitEntry />} />
            <Route path="/doctor/prescriptions" element={<PrescriptionEntry />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['nurse']} />}>
            <Route path="/nurse/patients" element={<NursePatients />} />
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardHome />} />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/nurses" element={<AdminNurses />} />
            <Route path="/admin/patients" element={<AdminPatients />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/laboratory" element={<AdminLaboratory />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/roles" element={<AdminRoleManagement />} />
            <Route path="/admin/audit-logs" element={<AdminAuditDashboard />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
