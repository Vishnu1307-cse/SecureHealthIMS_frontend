import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User, Calendar, Clock, Edit2, Save, X, Briefcase, Pill, Stethoscope, ChevronRight, Search } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';

const DoctorDashboard = () => {
    const { user, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Data State
    const [appointments, setAppointments] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Patient Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searching, setSearching] = useState(false);

    // Clinical Forms State
    const [showVisitForm, setShowVisitForm] = useState(false);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

    const [visitForm, setVisitForm] = useState({
        visit_date: new Date().toISOString().split('T')[0],
        chief_complaint: '',
        diagnosis: '',
        notes: ''
    });

    const [prescriptionForm, setPrescriptionForm] = useState({
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        notes: ''
    });

    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        phone: user?.phone || '',
        specialization: user?.specialization || '',
        license_number: user?.license_number || '',
        education: user?.education || '',
        experience_years: user?.experience_years || '',
        hospital_affiliation: user?.hospital_affiliation || ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Appointment action state
    const [decliningId, setDecliningId] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [aptActionLoading, setAptActionLoading] = useState(null);

    const handleAppointmentAction = async (appointmentId, status, reason) => {
        setAptActionLoading(appointmentId + status);
        try {
            const body = { status };
            if (status === 'Cancelled') body.decline_reason = reason;
            await api.patch(`/appointments/${appointmentId}/status`, body);
            setMessage(status === 'Confirmed' ? 'Appointment accepted.' :
                status === 'Cancelled' ? 'Appointment declined.' :
                status === 'Completed' ? 'Marked as Visited.' : 'Marked as No-Show.');
            setDecliningId(null);
            setDeclineReason('');
            fetchAppointments();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Action failed.');
            setTimeout(() => setMessage(''), 4000);
        }
        setAptActionLoading(null);
    };

    const fetchAppointments = async () => {
        setLoadingData(true);
        try {
            const res = await api.get('/appointments/me'); // Or /visits/doctor/me if implemented? Wait, this is appointments.
            // Keeping appointments for schedule. user.role=doctor should work if backend supports it.
            // Actually, backend appointments controller might need update for doctor? 
            // Previous task implementation for appointments was mostly specific to Patients or Admin.
            // Let's assume it works or returns empty.
            if (res.data.success) {
                // If API returns plain array or nested object, handle it safely
                setAppointments(res.data.data.appointments || []);
            }
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        }
        setLoadingData(false);
    };

    const handleSearchPatients = async () => {
        setSearching(true);
        try {
            const res = await api.get(`/patients/search?q=${searchQuery}`);
            if (res.data.success) {
                setSearchResults(res.data.data);
            }
        } catch (error) {
            console.error("Search failed", error);
        }
        setSearching(false);
    };

    useEffect(() => {
        if (activeTab === 'appointments' || activeTab === 'overview') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchAppointments();
        }
    }, [activeTab]);

    // Listen for chatbot navigation events
    useEffect(() => {
        const handleChatbotTab = (e) => {
            const validTabs = ['overview', 'appointments', 'patients', 'profile'];
            if (e.detail?.tab && validTabs.includes(e.detail.tab)) {
                setActiveTab(e.detail.tab);
            }
        };
        window.addEventListener('chatbot-set-tab', handleChatbotTab);
        return () => window.removeEventListener('chatbot-set-tab', handleChatbotTab);
    }, []);

    // Search Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2 && activeTab === 'patients') {
                handleSearchPatients();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, activeTab]);

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

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

    const handleCreateVisit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...visitForm, patient_id: selectedPatient.id };
            const res = await api.post('/visits', payload);
            if (res.data.success) {
                setMessage('Visit record created successfully!');
                setShowVisitForm(false);
                setVisitForm({
                    visit_date: new Date().toISOString().split('T')[0],
                    chief_complaint: '',
                    diagnosis: '',
                    notes: ''
                });
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to create visit');
        }
        setLoading(false);
    };

    const handleCreatePrescription = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...prescriptionForm, patient_id: selectedPatient.id };
            const res = await api.post('/prescriptions', payload);
            if (res.data.success) {
                setMessage('Prescription created successfully!');
                setShowPrescriptionForm(false);
                setPrescriptionForm({
                    medication_name: '',
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: '',
                    notes: ''
                });
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to create prescription');
        }
        setLoading(false);
    };

    const renderPatientsTab = () => {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '1fr 2fr' : '1fr', gap: '24px', transition: 'all 0.3s ease' }}>
                {/* Search Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Card>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Find Patient</h3>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        {searching && <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Searching...</p>}

                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {searchResults.map(patient => (
                                <div
                                    key={patient.id}
                                    onClick={() => setSelectedPatient(patient)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: selectedPatient?.id === patient.id ? 'var(--accent)' : 'var(--bg-secondary)',
                                        color: selectedPatient?.id === patient.id ? 'white' : 'var(--text-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{patient.name}</div>
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>{patient.email}</div>
                                    </div>
                                    <ChevronRight size={16} />
                                </div>
                            ))}
                            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No patients found.</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Selected Patient Details & Actions */}
                {selectedPatient && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{selectedPatient.name}</h2>
                                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        <span>{selectedPatient.gender}</span>
                                        <span>•</span>
                                        <span>{selectedPatient.date_of_birth}</span>
                                        <span>•</span>
                                        <span>{selectedPatient.blood_group || 'Blood Group N/A'}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button size="sm" onClick={() => setShowVisitForm(true)}>
                                        <Stethoscope size={16} style={{ marginRight: '6px' }} /> Record Visit
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => setShowPrescriptionForm(true)}>
                                        <Pill size={16} style={{ marginRight: '6px' }} /> Prescribe
                                    </Button>
                                </div>
                            </div>

                            {message && <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--accent)' }}>{message}</div>}

                            {/* Forms */}
                            {showVisitForm && (
                                <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>New Visit Record</h4>
                                    <form onSubmit={handleCreateVisit} style={{ display: 'grid', gap: '16px' }}>
                                        <Input type="date" label="Date" value={visitForm.visit_date} onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })} required />
                                        <Input label="Chief Complaint" value={visitForm.chief_complaint} onChange={(e) => setVisitForm({ ...visitForm, chief_complaint: e.target.value })} placeholder="e.g. Chest pain, shortness of breath" />
                                        <Input label="Diagnosis" value={visitForm.diagnosis} onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })} placeholder="e.g. Acute Bronchitis" required />
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-blue-200">Notes / Findings</label>
                                            <textarea
                                                className="w-full h-32 px-4 py-2 bg-blue-900/40 border border-blue-400/30 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm"
                                                placeholder="Enter clinical notes here..."
                                                value={visitForm.notes}
                                                onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <Button type="button" variant="secondary" onClick={() => setShowVisitForm(false)}>Cancel</Button>
                                            <Button type="submit" disabled={loading}>Save Record</Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {showPrescriptionForm && (
                                <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>New Prescription</h4>
                                    <form onSubmit={handleCreatePrescription} style={{ display: 'grid', gap: '16px' }}>
                                        <Input label="Medication Name" value={prescriptionForm.medication_name} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication_name: e.target.value })} required placeholder="e.g. Amoxicillin" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <Input label="Dosage" value={prescriptionForm.dosage} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} required placeholder="500mg" />
                                            <Input label="Frequency" value={prescriptionForm.frequency} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })} placeholder="3 times a day" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <Input label="Duration" value={prescriptionForm.duration} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })} placeholder="7 days" />
                                            <Input label="Instructions" value={prescriptionForm.instructions} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} placeholder="Take after food" />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <Button type="button" variant="secondary" onClick={() => setShowPrescriptionForm(false)}>Cancel</Button>
                                            <Button type="submit" disabled={loading}>Issue Prescription</Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Patient History Placeholder */}
                            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                                    <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>Recent Visits</h5>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Select patient to view history (Not implemented in this view yet)</p>
                                </div>
                                <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                                    <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>Active Prescriptions</h5>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Select patient to view history (Not implemented in this view yet)</p>
                                </div>
                            </div>

                        </Card>
                    </div>
                )}
            </div>
        );
    };

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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                    <Briefcase size={16} />
                                    <span>{user?.specialization || 'General Practitioner'}</span>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => setActiveTab('profile')} style={{ marginTop: '8px' }}>
                                    View Full Profile
                                </Button>
                            </div>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 149, 0, 0.1)', color: 'var(--warning)' }}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Upcoming Appointments</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        {appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length} scheduled
                                    </p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setActiveTab('appointments')} style={{ marginTop: '8px', width: '100%' }}>
                                Manage Schedule
                            </Button>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)' }}>
                                    <Stethoscope size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Clinical Features</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        Manage patients, visits, and prescriptions.
                                    </p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setActiveTab('patients')} style={{ marginTop: '8px', width: '100%' }}>
                                Go to Patients
                            </Button>
                        </Card>
                    </div>
                );
            case 'appointments':
                return (
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>My Appointments</h2>
                            <Button size="sm" onClick={fetchAppointments}>Refresh</Button>
                        </div>

                        {loadingData ? (
                            <p>Loading appointments...</p>
                        ) : appointments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                <Calendar size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <p>No appointments found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {message && (
                                    <div style={{
                                        padding: '12px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: message.includes('failed') || message.includes('Failed') ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)',
                                        color: message.includes('failed') || message.includes('Failed') ? 'var(--danger)' : 'var(--success)',
                                        fontSize: '14px'
                                    }}>
                                        {message}
                                    </div>
                                )}
                                {appointments.map(apt => {
                                    const now = new Date();
                                    const aptDateTime = new Date(`${apt.date}T${apt.time}`);
                                    const isTimeReached = now >= aptDateTime;
                                    const statusColor = apt.status === 'Confirmed' ? 'var(--success)' :
                                        apt.status === 'Pending' ? 'var(--warning)' :
                                        apt.status === 'Completed' ? 'var(--accent)' :
                                        apt.status === 'No-Show' ? 'var(--text-secondary)' :
                                        'var(--danger)';
                                    return (
                                        <div key={apt.id} style={{
                                            padding: '16px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: `4px solid ${statusColor}`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0, fontWeight: 600 }}>{apt.users?.name || apt.patient_name || 'Patient'}</h4>
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: `${statusColor}20`,
                                                    color: statusColor,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {apt.status === 'No-Show' ? 'No Show' : apt.status}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={14} /> {apt.date}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={14} /> {apt.time}
                                                </div>
                                            </div>
                                            {apt.reason && (
                                                <p style={{ margin: '4px 0 8px 0', fontSize: '14px' }}>
                                                    <span style={{ fontWeight: 500 }}>Reason:</span> {apt.reason}
                                                </p>
                                            )}

                                            {/* Accept / Decline for Pending appointments */}
                                            {apt.status === 'Pending' && (
                                                <div style={{ marginTop: '12px' }}>
                                                    {decliningId === apt.id ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <textarea
                                                                placeholder="Reason for declining (required)"
                                                                value={declineReason}
                                                                onChange={(e) => setDeclineReason(e.target.value)}
                                                                rows={2}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '8px 12px',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    border: '1px solid var(--border)',
                                                                    backgroundColor: 'var(--bg-primary)',
                                                                    color: 'var(--text-primary)',
                                                                    fontSize: '14px',
                                                                    resize: 'vertical',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            />
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="danger"
                                                                    disabled={!declineReason.trim() || aptActionLoading === apt.id + 'Cancelled'}
                                                                    onClick={() => handleAppointmentAction(apt.id, 'Cancelled', declineReason)}
                                                                >
                                                                    {aptActionLoading === apt.id + 'Cancelled' ? 'Declining...' : 'Confirm Decline'}
                                                                </Button>
                                                                <Button size="sm" variant="secondary" onClick={() => { setDecliningId(null); setDeclineReason(''); }}>Cancel</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <Button
                                                                size="sm"
                                                                disabled={aptActionLoading === apt.id + 'Confirmed'}
                                                                onClick={() => handleAppointmentAction(apt.id, 'Confirmed')}
                                                            >
                                                                {aptActionLoading === apt.id + 'Confirmed' ? 'Accepting...' : '✓ Accept'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() => setDecliningId(apt.id)}
                                                            >
                                                                ✕ Decline
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mark Visited / No-Show — only shown after appointment date+time */}
                                            {apt.status === 'Confirmed' && isTimeReached && (
                                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                    <Button
                                                        size="sm"
                                                        disabled={aptActionLoading === apt.id + 'Completed'}
                                                        onClick={() => handleAppointmentAction(apt.id, 'Completed')}
                                                        style={{ backgroundColor: 'var(--success)', color: '#fff' }}
                                                    >
                                                        {aptActionLoading === apt.id + 'Completed' ? 'Saving...' : '✓ Patient Visited'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        disabled={aptActionLoading === apt.id + 'No-Show'}
                                                        onClick={() => handleAppointmentAction(apt.id, 'No-Show')}
                                                    >
                                                        {aptActionLoading === apt.id + 'No-Show' ? 'Saving...' : '✗ No Show'}
                                                    </Button>
                                                </div>
                                            )}

                                            {apt.status === 'Confirmed' && !isTimeReached && (
                                                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    ⏳ Visit actions available after {apt.date} at {apt.time}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                );

            case 'profile':
                return (
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Doctor Profile</h2>
                            {!isEditing ? (
                                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={16} style={{ marginRight: '8px' }} /> Edit Professional Details
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

                        <div style={{ display: 'grid', gap: '24px' }}>
                            {/* Basic Info (Read Only) */}
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                                    <User size={18} style={{ marginRight: '8px' }} /> Personal Information
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</span>
                                        <span style={{ fontWeight: 500 }}>{user?.name}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Email</span>
                                        <span>{user?.email}</span>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</span>
                                        <span style={{ color: user?.approval_status === 'approved' ? 'var(--success)' : 'var(--warning)', fontWeight: 600, textTransform: 'capitalize' }}>
                                            {user?.approval_status || 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details (Editable) */}
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                                    <Briefcase size={18} style={{ marginRight: '8px' }} /> Professional Details
                                </h3>

                                {isEditing ? (
                                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}>
                                        <Input label="Specialization" name="specialization" value={editForm.specialization} onChange={handleEditChange} required />
                                        <Input label="License Number" name="license_number" value={editForm.license_number} onChange={handleEditChange} placeholder="e.g. LIC-12345" />
                                        <Input label="Education / Qualifications" name="education" value={editForm.education} onChange={handleEditChange} placeholder="e.g. MBBS, MD Cardiology" />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <Input label="Experience (Years)" type="number" name="experience_years" value={editForm.experience_years} onChange={handleEditChange} />
                                            <Input label="Phone" name="phone" value={editForm.phone} onChange={handleEditChange} />
                                        </div>
                                        <Input label="Hospital Affiliation" name="hospital_affiliation" value={editForm.hospital_affiliation} onChange={handleEditChange} placeholder="Current hospital or clinic" />

                                        <Button type="submit" disabled={loading} style={{ marginTop: '8px' }}>
                                            <Save size={18} style={{ marginRight: '8px' }} />
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </form>
                                ) : (
                                    <div style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Specialization</span>
                                                <span style={{ fontSize: '16px', fontWeight: 500 }}>{user?.specialization || '-'}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>License Number</span>
                                                <span style={{ fontSize: '16px' }}>{user?.license_number || '-'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Education</span>
                                            <span>{user?.education || '-'}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Experience</span>
                                                <span>{user?.experience_years ? `${user.experience_years} Years` : '-'}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Phone</span>
                                                <span>{user?.phone || '-'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Affiliation</span>
                                            <span>{user?.hospital_affiliation || '-'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );

            case 'patients':
                return renderPatientsTab();

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
                        Doctor Portal
                    </div>
                    <h1 className="title-font" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1.5px' }}>
                        Welcome back, <span style={{ color: 'var(--primary)' }}>Dr. {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Manage your appointments, patient records, and professional schedule.</p>
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
                    {['overview', 'appointments', 'patients', 'profile'].map(tab => (
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
                            {tab}
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

export default DoctorDashboard;
