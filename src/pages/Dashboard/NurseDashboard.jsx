import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Card from '../../components/ui/Card';
import { User, Calendar, Clock, Search, ChevronRight, FileText, Eye, Lock } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';

const NurseDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Patient Search State (Read-Only)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searching, setSearching] = useState(false);
    
    // Prescriptions State
    const [prescriptions, setPrescriptions] = useState([]);
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

    // Appointments State
    const [appointments, setAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);

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

    // Fetch Prescriptions and Appointments when patient is selected
    useEffect(() => {
        if (selectedPatient) {
            const fetchPrescriptions = async () => {
                setLoadingPrescriptions(true);
                try {
                    const res = await api.get(`/prescriptions/patient/${selectedPatient.id}`);
                    if (res.data.success) {
                        setPrescriptions(res.data.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch prescriptions:", error);
                    setPrescriptions([]);
                }
                setLoadingPrescriptions(false);
            };

            const fetchAppointments = async () => {
                setLoadingAppointments(true);
                try {
                    // Re-use doctor's endpoint for patient appointments or general patient endpoint
                    const res = await api.get(`/appointments/patient/${selectedPatient.id}`);
                    if (res.data.success) {
                        setAppointments(res.data.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch appointments:", error);
                    setAppointments([]);
                }
                setLoadingAppointments(false);
            };

            fetchPrescriptions();
            fetchAppointments();
        } else {
            setPrescriptions([]);
            setAppointments([]);
        }
    }, [selectedPatient]);

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

                {/* Selected Patient Details (READ-ONLY — no edit/create buttons) */}
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
                                {/* Read-only badge instead of action buttons */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: 'rgba(255, 149, 0, 0.1)',
                                    color: 'var(--warning)',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    <Eye size={14} />
                                    Read-Only Access
                                </div>
                            </div>

                            {/* Patient Info Display (Read-Only) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Phone</span>
                                    <span style={{ fontWeight: 500 }}>{selectedPatient.phone || 'Not provided'}</span>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email</span>
                                    <span style={{ fontWeight: 500 }}>{selectedPatient.email}</span>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Address</span>
                                    <span style={{ fontWeight: 500 }}>{selectedPatient.address || 'Not provided'}</span>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Allergies</span>
                                    <span style={{ fontWeight: 500 }}>{selectedPatient.allergies || 'None listed'}</span>
                                </div>
                            </div>

                            {/* Restriction notice */}
                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                backgroundColor: 'rgba(255, 149, 0, 0.05)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(255, 149, 0, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <Lock size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    As a nurse, you have <strong>read-only access</strong> to patient records. To create visits, prescriptions, or modify records, please contact a doctor.
                                </p>
                            </div>
                        </Card>

                        {/* Prescriptions Section (Read-Only) */}
                        <Card>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={20} style={{ color: 'var(--accent)' }} />
                                Active Prescriptions
                            </h3>
                            
                            {loadingPrescriptions ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Loading prescriptions...</p>
                            ) : prescriptions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {prescriptions.map((px) => (
                                        <div key={px.id} style={{
                                            padding: '16px',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--bg-secondary)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{px.medication_name}</h4>
                                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        {px.dosage} • {px.frequency}
                                                    </p>
                                                </div>
                                                <div style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 'var(--radius-full)',
                                                    backgroundColor: 'rgba(0, 122, 255, 0.1)',
                                                    color: 'var(--accent)',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {px.duration || 'N/A'}
                                                </div>
                                            </div>
                                            
                                            {px.instructions && (
                                                <div style={{ fontSize: '14px', color: 'var(--text-primary)', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                                                    <strong>Instructions:</strong> {px.instructions}
                                                </div>
                                            )}
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={12} />
                                                    Prescribed by {px.users?.name || 'Doctor'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} />
                                                    {new Date(px.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                    No prescriptions found for this patient.
                                </p>
                            )}
                        </Card>

                        {/* Appointments Section (Read-Only) */}
                        <Card>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={20} style={{ color: 'var(--accent)' }} />
                                Appointments
                            </h3>
                            
                            {loadingAppointments ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>Loading appointments...</p>
                            ) : appointments.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {appointments.map((apt) => (
                                        <div key={apt.id} style={{
                                            padding: '16px',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border)',
                                            backgroundColor: 'var(--bg-secondary)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                    {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    Doctor: {apt.doctor?.name || 'Unknown'}
                                                </div>
                                                {apt.reason && (
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                        Reason: {apt.reason}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{
                                                padding: '4px 10px',
                                                borderRadius: 'var(--radius-full)',
                                                backgroundColor: apt.status === 'scheduled' ? 'rgba(0, 122, 255, 0.1)' : 
                                                                 apt.status === 'completed' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                                color: apt.status === 'scheduled' ? 'var(--accent)' : 
                                                       apt.status === 'completed' ? 'var(--success)' : 'var(--danger)',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {apt.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                    No appointments found for this patient.
                                </p>
                            )}
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
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.name || user?.full_name}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    Role: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>Nurse</span>
                                </p>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    Email: <span style={{ fontWeight: 500 }}>{user?.email}</span>
                                </p>
                            </div>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)' }}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Patient Records</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        View-only access to patient data
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('patients')}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    marginTop: '8px'
                                }}
                            >
                                Search Patients
                            </button>
                        </Card>

                        <Card>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255, 149, 0, 0.1)', color: 'var(--warning)' }}>
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Access Level</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        Read-only permissions
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                padding: '12px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.5'
                            }}>
                                You can view patient records and appointments. Creating or modifying clinical records requires doctor-level access.
                            </div>
                        </Card>
                    </div>
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
                        background: 'rgba(52, 199, 89, 0.1)',
                        color: 'var(--success)',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '16px'
                    }}>
                        Nurse Portal
                    </div>
                    <h1 className="title-font" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1.5px' }}>
                        Welcome back, <span style={{ color: 'var(--success)' }}>{user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Nurse'}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>View patient records with read-only access.</p>
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
                    {['overview', 'patients'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 24px',
                                borderRadius: 'var(--radius-full)',
                                border: 'none',
                                backgroundColor: activeTab === tab ? 'var(--success)' : 'transparent',
                                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
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

export default NurseDashboard;
