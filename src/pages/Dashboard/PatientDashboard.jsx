import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { User, Edit2, Save, X, Shield, Check, AlertCircle, FileText, Pill } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import PatientRegistrationModal from '../../components/patient/PatientRegistrationModal';

const PatientDashboard = () => {
    const { user, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Data State
    const [visits, setVisits] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [bookingForm, setBookingForm] = useState({ doctor_id: '', date: '', time: '' });



    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    // Initialize form with user data
    const [editForm, setEditForm] = useState({
        phone: user?.phone || '',
        address: user?.address || '',
        dob: user?.dob || '',
        gender: user?.gender || '',
        blood_group: user?.blood_group || '',
        allergies: user?.allergies || '',
        medical_history: user?.medical_history || '',
        emergency_contact: user?.emergency_contact || '',
        emergency_phone: user?.emergency_phone || ''
    });

    // Consents State
    const [loadingConsents, setLoadingConsents] = useState(false);
    const [isSharingData, setIsSharingData] = useState(false);

    // Registration State
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [checkingRegistration, setCheckingRegistration] = useState(true);
    const [registrationForm, setRegistrationForm] = useState({
        full_name: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        address: '',
        allergies: '',
        medical_history: '',
        emergency_contact: '',
        emergency_phone: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchVisits = async () => {
        setLoadingData(true);
        try {
            const res = await api.get('/visits/me');
            if (res.data.success) {
                setVisits(res.data.data.visits);
            }
        } catch (error) {
            console.error("Failed to fetch visits", error);
        }
        setLoadingData(false);
    };

    const fetchPrescriptions = async () => {
        setLoadingData(true);
        try {
            const res = await api.get('/prescriptions/me');
            if (res.data.success) {
                setPrescriptions(res.data.data.prescriptions);
            }
        } catch (error) {
            console.error("Failed to fetch prescriptions", error);
        }
        setLoadingData(false);
    };

    const fetchAuditLogs = async () => {
        setLoadingData(true);
        try {
            const res = await api.get('/audit/me');
            if (res.data.success) {
                setAuditLogs(res.data.data.logs);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        }
        setLoadingData(false);
    };

    const fetchAppointments = async () => {
        setLoadingData(true);
        try {
            const res = await api.get('/appointments/me');
            if (res.data.success) {
                setAppointments(res.data.data.appointments || []);
            }
        } catch (error) {
            console.error('Failed to fetch appointments', error);
        }
        setLoadingData(false);
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/doctors');
            if (res.data.success) {
                setDoctors(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/appointments', bookingForm);
            if (res.data.success) {
                setMessage('Appointment booked successfully!');
                setBookingForm({ doctor_id: '', date: '', time: '' });
                fetchVisits(); // refresh appointments
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error("Failed to book appointment", error);
            setMessage(error.response?.data?.message || 'Failed to book appointment.');
            setTimeout(() => setMessage(''), 3000);
        }
        setLoading(false);
    };





    const fetchConsents = async () => {
        setLoadingConsents(true);
        try {
            const res = await api.get('/consent/me');
            if (res.data.success) {
                // Check if 'medical_records' or 'data_sharing' is granted to determine the toggle state
                const hasConsent = res.data.data.consents.some(
                    c => (c.consent_type === 'medical_records' || c.consent_type === 'data_sharing') && c.status === 'granted'
                );
                setIsSharingData(hasConsent);
            }
        } catch (err) {
            console.error("Failed to fetch consents", err);
        }
        setLoadingConsents(false);
    };

    const toggleDataSharing = async () => {
        const newStatus = !isSharingData;
        setIsSharingData(newStatus); // Optimistic update

        try {
            // We'll toggle multiple consents based on the single switch
            const typesToToggle = ['medical_records', 'data_sharing', 'treatment', 'research'];
            const endpoint = newStatus ? '/consent/grant' : '/consent/revoke';

            // Execute all requests in parallel
            await Promise.all(typesToToggle.map(type =>
                api.post(endpoint, { consent_type: type })
            ));

            // Refetch to ensure sync
            fetchConsents();

        } catch (error) {
            console.error("Failed to update consent settings", error);
            setMessage('Failed to update consent settings');
            setIsSharingData(!newStatus); // Revert on error
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Only send editable fields
        const res = await updateProfile(editForm);

        if (res.success) {
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage(res.message || 'Failed to update profile');
        }
        setLoading(false);
    };

    const checkRegistrationStatus = async () => {
        setCheckingRegistration(true);
        try {
            // Try to fetch current user data to see if they're in users table
            const res = await api.get('/auth/me');
            if (res.data.success && (res.data.data.user || res.data.data.id)) {
                setIsRegistered(true);
            }
        } catch {
            console.log('User not registered in users table yet');
            setIsRegistered(false);

            // Fetch patient data to pre-fill form
            try {
                const patientRes = await api.get('/patients/me');
                if (patientRes.data.success && patientRes.data.data) {
                    const patientData = patientRes.data.data;
                    setRegistrationForm(prev => ({
                        ...prev,
                        date_of_birth: patientData.date_of_birth || '',
                        address: patientData.address || ''
                    }));
                }
            } catch (err) {
                console.log('Could not fetch patient data:', err);
            }
        }
        setCheckingRegistration(false);
    };

    const handleRegistrationFormChange = (e) => {
        setRegistrationForm({ ...registrationForm, [e.target.name]: e.target.value });
    };

    const handleRegisterAsUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await api.post('/patients/register-user', registrationForm);

            if (res.data.success) {
                setMessage(res.data.data.message || 'Successfully registered!');
                setIsRegistered(true);
                setShowRegistrationForm(false);

                // Reset form
                setRegistrationForm({
                    full_name: '',
                    phone: '',
                    date_of_birth: '',
                    gender: '',
                    blood_group: '',
                    address: '',
                    allergies: '',
                    medical_history: '',
                    emergency_contact: '',
                    emergency_phone: ''
                });

                setTimeout(() => setMessage(''), 5000);
            } else {
                setMessage(res.data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setMessage(error.response?.data?.message || 'Failed to register. Please try again.');
        }
        setLoading(false);
    };

    // Check registration status on mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkRegistrationStatus();
    }, []);

    // Listen for chatbot navigation events
    useEffect(() => {
        const handleChatbotTab = (e) => {
            const validTabs = ['overview', 'medical-history', 'prescriptions', 'appointments', 'profile', 'privacy', 'audit', 'book-appointment'];
            if (e.detail?.tab && validTabs.includes(e.detail.tab)) {
                setActiveTab(e.detail.tab);
            }
        };
        window.addEventListener('chatbot-set-tab', handleChatbotTab);
        return () => window.removeEventListener('chatbot-set-tab', handleChatbotTab);
    }, []);

    // Fetch consents when tab is active
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (activeTab === 'privacy') {
            fetchConsents();
        }

        if (activeTab === 'medical-history') {
            fetchVisits();
        }
        if (activeTab === 'prescriptions') {
            fetchPrescriptions();
        }
        if (activeTab === 'audit') {
            fetchAuditLogs();
        }
        if (activeTab === 'book-appointment') {
            fetchDoctors();
        }
        if (activeTab === 'appointments') {
            fetchAppointments();
        }
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [activeTab]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(0, 122, 255, 0.1)', color: 'var(--accent)' }}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>My Profile</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.name}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Status: <span style={{ color: 'var(--success)', fontWeight: 500 }}>Active</span></p>
                                <Button variant="secondary" size="sm" onClick={() => setActiveTab('profile')} style={{ marginTop: '8px' }}>
                                    View Full Profile
                                </Button>
                            </div>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)' }}>
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Privacy & Consents</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your data</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>Data Sharing</span>
                                <span style={{ fontSize: '12px', color: isSharingData ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>
                                    {isSharingData ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setActiveTab('privacy')} style={{ marginTop: '16px', width: '100%' }}>
                                Manage Settings
                            </Button>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 149, 0, 0.1)', color: 'var(--warning)' }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Appointments</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>Schedule a new visit</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setActiveTab('book-appointment')} style={{ marginTop: '8px', width: '100%' }}>
                                Book Appointment
                            </Button>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 59, 48, 0.1)', color: 'var(--danger)' }}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Medical History</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>View recent visits</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setActiveTab('medical-history')} style={{ marginTop: '8px', width: '100%' }}>
                                View History
                            </Button>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)' }}>
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Data Access Logs</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>See who viewed your records</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setActiveTab('audit')} style={{ marginTop: '8px', width: '100%' }}>
                                View Logs
                            </Button>
                        </Card>
                    </div>
                );
            case 'audit':
                return (
                    <Card>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Data Access Logs</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            View a transparent log of who has accessed your medical information and when.
                        </p>

                        {loadingData ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Loading logs...</p>
                        ) : auditLogs.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No access logs found.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {auditLogs.map(log => (
                                    <div key={log.id} style={{
                                        padding: '16px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    backgroundColor: log.action === 'CREATE' ? 'rgba(0, 122, 255, 0.1)' : log.action === 'READ' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                                                    color: log.action === 'CREATE' ? 'var(--accent)' : log.action === 'READ' ? 'var(--success)' : 'var(--warning)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {log.action}
                                                </span>
                                                <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                                    {log.resource?.replace(/_/g, ' ') || 'record'}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '14px', margin: '0 0 4px 0', fontWeight: 500 }}>
                                                {log.performer
                                                    ? log.performer.role === 'doctor'
                                                        ? `Dr. ${log.performer.name}${log.performer.specialization ? ` (${log.performer.specialization})` : ''}`
                                                        : `${log.performer.name} (${log.performer.role})`
                                                    : 'System'}
                                            </p>
                                            {log.details?.details?.action && (
                                                <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                                    {log.details.details.action.replace(/_/g, ' ')}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                );
            case 'book-appointment':
                return (
                    <Card>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Book an Appointment</h2>

                        {message && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '16px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: message.includes('success') ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                color: message.includes('success') ? 'var(--success)' : 'var(--danger)'
                            }}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleBookAppointment} style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>
                            <Select
                                label="Select Doctor"
                                name="doctor_id"
                                required
                                value={bookingForm.doctor_id}
                                onChange={(e) => setBookingForm({ ...bookingForm, doctor_id: e.target.value })}
                            >
                                <option value="" disabled>-- Choose a Doctor --</option>
                                {doctors.map(doc => (
                                    <option key={doc.user_id} value={doc.user_id}>
                                        Dr. {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                                    </option>
                                ))}
                            </Select>

                            <Input
                                label="Date"
                                type="date"
                                name="date"
                                value={bookingForm.date}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                                required
                            />

                            <Input
                                label="Time"
                                type="time"
                                name="time"
                                value={bookingForm.time}
                                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                                required
                            />

                            <Button type="submit" style={{ marginTop: '16px' }} disabled={loading}>
                                {loading ? 'Booking...' : 'Confirm Booking'}
                            </Button>
                        </form>
                    </Card>
                );
            case 'profile':
                return (
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>My Profile</h2>
                            {!isEditing ? (
                                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit Details
                                </Button>
                            ) : (
                                <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                                    <X size={16} style={{ marginRight: '8px' }} /> Cancel
                                </Button>
                            )}
                        </div>

                        {message && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '16px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: message.includes('success') ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                color: message.includes('success') ? 'var(--success)' : 'var(--danger)'
                            }}>
                                {message}
                            </div>
                        )}

                        {/* Basic Info - Always Read Only */}
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basic Information</h3>
                            <div style={{ display: 'grid', gap: '16px', maxWidth: '600px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Full Name:</span>
                                    <span style={{ fontSize: '16px', fontWeight: 500 }}>{user?.name}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Email:</span>
                                    <span style={{ fontSize: '16px' }}>{user?.email}</span>
                                </div>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                Basic information cannot be changed directly. Contact admin for corrections.
                            </p>
                        </div>

                        {/* Additional Details - Editable */}
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Additional Details</h3>

                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <Input label="Blood Group" name="blood_group" value={editForm.blood_group} onChange={handleEditChange} placeholder="e.g. O+" />
                                        <Input label="Date of Birth" type="date" name="dob" value={editForm.dob} onChange={handleEditChange} />
                                    </div>

                                    <Input label="Phone Number" name="phone" value={editForm.phone} onChange={handleEditChange} placeholder="Enter phone number" />
                                    <Input label="Address" name="address" value={editForm.address} onChange={handleEditChange} placeholder="Enter full address" />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                        <Select
                                            label="Gender"
                                            name="gender"
                                            value={editForm.gender}
                                            onChange={handleEditChange}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </Select>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Allergies</label>
                                        <textarea
                                            name="allergies"
                                            value={editForm.allergies}
                                            onChange={handleEditChange}
                                            placeholder="List any allergies..."
                                            style={{
                                                padding: '12px',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border)',
                                                backgroundColor: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                minHeight: '80px',
                                                fontFamily: 'inherit',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Medical History</label>
                                        <textarea
                                            name="medical_history"
                                            value={editForm.medical_history}
                                            onChange={handleEditChange}
                                            placeholder="Previous health conditions or surgeries..."
                                            style={{
                                                padding: '12px',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border)',
                                                backgroundColor: 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                minHeight: '100px',
                                                fontFamily: 'inherit',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    <Button type="submit" disabled={loading}>
                                        <Save size={18} style={{ marginRight: '8px' }} />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </form>
                            ) : (
                                <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div style={{ display: 'grid', gap: '4px' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Blood Group</span>
                                            <span style={{ fontSize: '16px', fontWeight: 500 }}>{user?.blood_group || '-'}</span>
                                        </div>
                                        <div style={{ display: 'grid', gap: '4px' }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Date of Birth</span>
                                            <span style={{ fontSize: '16px' }}>{user?.dob || '-'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Phone:</span>
                                        <span style={{ fontSize: '16px' }}>{user?.phone || 'Not provided'}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Address:</span>
                                        <span style={{ fontSize: '16px' }}>{user?.address || 'Not provided'}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Gender:</span>
                                        <span style={{ fontSize: '16px', textTransform: 'capitalize' }}>{user?.gender || 'Not provided'}</span>
                                    </div>

                                    <div style={{ marginTop: '16px' }}>
                                        <span style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '8px' }}>Allergies:</span>
                                        <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', minHeight: '40px' }}>
                                            {user?.allergies ? user.allergies : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>None listed</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <span style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '8px' }}>Medical History:</span>
                                        <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', minHeight: '60px' }}>
                                            {user?.medical_history ? user.medical_history : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No history recorded</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                );
            case 'privacy':
                return (
                    <Card>
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Privacy & Consents</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Manage your consent for data sharing. You are in control.</p>
                        </div>

                        {loadingConsents ? (
                            <p>Loading settings...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{
                                    padding: '24px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: isSharingData ? '1px solid var(--success)' : '1px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ paddingRight: '24px' }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
                                            I am willing to share my data to doctors
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                            By enabling this, you grant consent for medical professionals to view your records, previous history, and treatment details to provide better care. You also agree to standard data sharing for hospital administration.
                                        </p>
                                    </div>

                                    <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px', flexShrink: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={isSharingData}
                                            onChange={toggleDataSharing}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            cursor: 'pointer',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: isSharingData ? 'var(--success)' : '#ccc',
                                            transition: '.4s',
                                            borderRadius: '34px'
                                        }}></span>
                                        <span style={{
                                            position: 'absolute',
                                            content: '""',
                                            height: '26px', width: '26px',
                                            left: isSharingData ? '30px' : '4px',
                                            bottom: '4px',
                                            backgroundColor: 'white',
                                            transition: '.4s',
                                            borderRadius: '50%',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}></span>
                                    </label>
                                </div>

                                {message && (
                                    <div style={{
                                        padding: '12px',
                                        marginTop: '16px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                                        color: 'var(--danger)',
                                        textAlign: 'center'
                                    }}>
                                        {message}
                                    </div>
                                )}

                                {/* Registration Section */}
                                <div style={{
                                    marginTop: '32px',
                                    padding: '24px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1px solid var(--border)'
                                }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
                                        Patient Registration
                                    </h4>
                                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        Register yourself in the system to be searchable by doctors and access full platform features.
                                    </p>

                                    {checkingRegistration ? (
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Checking registration status...</p>
                                    ) : isRegistered ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                                            <Check size={20} />
                                            <span style={{ fontWeight: 500 }}>You are already registered in the system</span>
                                        </div>
                                    ) : (
                                        <Button onClick={() => setShowRegistrationForm(true)}>
                                            Register as User
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <PatientRegistrationModal
                            show={showRegistrationForm}
                            onClose={() => setShowRegistrationForm(false)}
                            onSubmit={handleRegisterAsUser}
                            formData={registrationForm}
                            onChange={handleRegistrationFormChange}
                            loading={loading}
                            message={message}
                        />
                    </Card>
                );

            case 'medical-history':
                return (
                    <Card>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
                            <FileText size={24} style={{ marginRight: '10px', color: 'var(--accent)' }} /> Medical History
                        </h2>
                        {loadingData ? (
                            <p>Loading visits...</p>
                        ) : visits.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <p>No visit history found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {visits.map(visit => (
                                    <div key={visit.id} style={{
                                        padding: '20px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        borderLeft: '4px solid var(--accent)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                                                    {visit.visit_date}
                                                </h4>
                                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                    Dr. {visit.doctor?.name || 'Unknown'}{visit.doctor?.specialization ? ` · ${visit.doctor.specialization}` : ''}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.05)', height: 'fit-content' }}>
                                                Visit
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {visit.chief_complaint && (
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complaint</span>
                                                    <p style={{ margin: 0, fontSize: '15px' }}>{visit.chief_complaint}</p>
                                                </div>
                                            )}
                                            {visit.diagnosis && (
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Diagnosis</span>
                                                    <p style={{ margin: 0, fontSize: '15px' }}>{visit.diagnosis}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                );

            case 'appointments':
                return (
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                <AlertCircle size={24} style={{ marginRight: '10px', color: 'var(--warning)' }} /> My Appointments
                            </h2>
                            <Button size="sm" variant="secondary" onClick={() => setActiveTab('book-appointment')}>+ Book New</Button>
                        </div>
                        {loadingData ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Loading appointments...</p>
                        ) : appointments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <p>No appointments found.</p>
                                <Button style={{ marginTop: '16px' }} onClick={() => setActiveTab('book-appointment')}>Book an Appointment</Button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {appointments.map(apt => {
                                    const displayStatus = apt.status === 'Confirmed' ? 'Approved' : apt.status === 'No-Show' ? 'No Show' : apt.status;
                                    const statusColor = apt.status === 'Confirmed' ? 'var(--success)' : apt.status === 'Cancelled' ? 'var(--danger)' : apt.status === 'Completed' ? 'var(--accent)' : apt.status === 'No-Show' ? 'var(--text-secondary)' : 'var(--warning)';
                                    return (
                                        <div key={apt.id} style={{
                                            padding: '20px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            borderLeft: `4px solid ${statusColor}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            flexWrap: 'wrap',
                                            gap: '12px'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: 600 }}>
                                                        Dr. {apt.doctor_details?.name || apt.doctor_name || 'Unknown'}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: apt.doctor_details?.specialization ? 'var(--text-secondary)' : 'transparent' }}>
                                                        {apt.doctor_details?.specialization}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                                    <span>📅 {apt.date}</span>
                                                    <span>🕐 {apt.time}</span>
                                                </div>
                                                {apt.reason && <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>Reason: {apt.reason}</p>}
                                            </div>
                                            <span style={{
                                                padding: '6px 14px',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                backgroundColor: `${statusColor}20`,
                                                color: statusColor,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                flexShrink: 0
                                            }}>
                                                {displayStatus}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                );

            case 'prescriptions':
                return (
                    <Card>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
                            <Pill size={24} style={{ marginRight: '10px', color: 'var(--success)' }} /> Prescriptions
                        </h2>
                        {loadingData ? (
                            <p>Loading prescriptions...</p>
                        ) : prescriptions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                <Pill size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <p>No prescriptions found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                                {prescriptions.map(presc => (
                                    <div key={presc.id} style={{
                                        padding: '20px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                            <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)', marginRight: '12px' }}>
                                                <Pill size={20} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 600 }}>{presc.medication_name}</h4>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    Dr. {presc.users?.name || 'Unknown'}{presc.users?.specialization ? ` · ${presc.users.specialization}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Dosage</span>
                                                <span style={{ fontWeight: 500 }}>{presc.dosage}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Frequency</span>
                                                <span style={{ fontWeight: 500 }}>{presc.frequency}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Duration</span>
                                                <span style={{ fontWeight: 500 }}>{presc.duration}</span>
                                            </div>
                                        </div>
                                        {presc.instructions && (
                                            <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}>
                                                <span style={{ fontWeight: 600 }}>Note:</span> {presc.instructions}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            <Navbar />
            <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
                <header style={{ marginBottom: '48px' }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '16px'
                    }}>
                        Patient Portal
                    </div>
                    <h1 className="title-font" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1.5px' }}>
                        Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Manage your health profile, consultation history, and privacy settings.</p>
                </header>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '40px',
                    overflowX: 'auto',
                    padding: '8px',
                    background: 'var(--glass-bg)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--glass-stroke)',
                    width: 'fit-content',
                    backdropFilter: 'blur(20px)'
                }}>
                    {['overview', 'medical-history', 'prescriptions', 'appointments', 'profile', 'privacy', 'audit', 'book-appointment'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 24px',
                                borderRadius: 'var(--radius-full)',
                                border: 'none',
                                backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'none',
                                transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                            className="hover-scale"
                        >
                            {tab.replace('-', ' ')}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {renderTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PatientDashboard;
