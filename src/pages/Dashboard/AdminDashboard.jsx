import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import Tabs from '../../components/ui/Tabs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User, LayoutDashboard, Stethoscope } from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await api.get('/audit/all');
            if (res.data.success) {
                setAuditLogs(res.data.data.logs);
            }
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchAuditLogs();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.post(`/admin/approve/${id}`);
            alert('Doctor approved successfully');
            fetchUsers(); // Refresh list
        } catch {
            alert('Failed to approve doctor');
        }
    };

    const handleBan = async (id, role, action) => {
        // action: 'ban' or 'unban'
        const verb = action === 'ban' ? 'ban' : 'unban';
        if (!window.confirm(`Are you sure you want to ${verb} this user?`)) return;

        try {
            const endpoint = action === 'ban' ? `/admin/ban/${id}` : `/admin/unban/${id}`;
            await api.post(endpoint, { role });
            alert(`User ${verb}ned successfully`);
            fetchUsers(); // Refresh list
        } catch (err) {
            alert(`Failed to ${verb} user`);
            console.error(err);
        }
    };

    // Filter Users based on Search
    const filteredUsers = users.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const patients = filteredUsers.filter(u => u.role === 'patient');
    const doctors = filteredUsers.filter(u => u.role === 'doctor');
    const nurses = filteredUsers.filter(u => u.role === 'nurse');

    // Doctor Sub-sections
    const pendingDoctors = doctors.filter(d => !d.verified);
    const verifiedDoctors = doctors.filter(d => d.verified);

    const UserList = ({ list, showActions = false }) => (
        <div style={{ display: 'grid', gap: '16px' }}>
            {list.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No users found.</p>}
            {list.map(user => (
                <Card key={user.id} padding="16px" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{user.name} ({user.email})</h4>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <span style={{ marginRight: '12px' }}>Role: {user.role}</span>

                            {/* Status based on verified flag as requested */}
                            <span style={{
                                color: user.verified ? 'var(--success)' : 'var(--danger)',
                                fontWeight: 500
                            }}>
                                Status: {user.verified ? 'Unbanned' : 'Banned'}
                            </span>

                            {/* Patient Consent */}
                            {user.role === 'patient' && (
                                <span style={{ marginLeft: '12px' }}>
                                    Consent: {user.consent ? 'True' : 'False'} | Verified: {user.verified ? 'True' : 'False'}
                                </span>
                            )}
                        </div>
                        {user.role === 'doctor' && user.specialization && (
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Spec: {user.specialization}</p>
                        )}
                    </div>
                    {showActions && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Doctor Approval (Only for unverified doctors) */}
                            {user.role === 'doctor' && !user.verified && (
                                <Button size="sm" onClick={() => handleApprove(user.id)}>Approve</Button>
                            )}

                            {/* Ban/Unban Buttons based on verified status */}
                            {user.verified ? (
                                <Button variant="danger" size="sm" onClick={() => handleBan(user.id, user.role, 'ban')}>Ban</Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={() => handleBan(user.id, user.role, 'unban')}>Unban</Button>
                            )}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );

    const DoctorTabContent = () => (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--warning)' }}>Pending Verification ({pendingDoctors.length})</h3>
                <UserList list={pendingDoctors} showActions={true} />
            </div>
            <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'var(--success)' }}>Verified Doctors ({verifiedDoctors.length})</h3>
                <UserList list={verifiedDoctors} showActions={true} />
            </div>
        </div>
    );

    const AuditLogsTab = () => (
        <div style={{ display: 'grid', gap: '16px' }}>
            {auditLoading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading system logs...</p>
            ) : auditLogs.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No audit logs found.</p>
            ) : (
                auditLogs.map(log => (
                    <Card key={log.id} padding="16px">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        backgroundColor: log.status === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                        color: log.status === 'success' ? 'var(--success)' : 'var(--danger)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {log.action}
                                    </span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>IP: {log.ip_address}</span>
                                </div>
                                <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                                    <strong style={{ color: 'var(--text-secondary)' }}>Actor ({log.actor_role}):</strong> {log.actor_id}
                                </p>
                                <p style={{ fontSize: '14px' }}>
                                    <strong style={{ color: 'var(--text-secondary)' }}>Resource:</strong> {log.resource} {log.resource_id ? `(${log.resource_id})` : ''}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {new Date(log.created_at).toLocaleString()}
                            </div>
                        </div>
                        {log.details && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto' }}>
                                {JSON.stringify(log.details)}
                            </div>
                        )}
                    </Card>
                ))
            )}
        </div>
    );

    const tabs = [
        { id: 'doctors', label: 'Doctors', content: <DoctorTabContent /> },
        { id: 'patients', label: 'Patients', content: <UserList list={patients} showActions={true} /> },
        { id: 'nurses', label: 'Nurses', content: <UserList list={nurses} showActions={true} /> },
        { id: 'audit', label: 'System Logs', content: <AuditLogsTab /> },
    ];

    if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
    if (error) return <div style={{ padding: '24px', color: 'red' }}>{error}</div>;

    // Statistics (Verified/Unbanned only)
    const stats = {
        doctors: users.filter(u => u.role === 'doctor' && u.verified).length,
        patients: users.filter(u => u.role === 'patient' && u.verified).length,
        nurses: users.filter(u => u.role === 'nurse' && u.verified).length
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            <Navbar />
            <div className="animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '48px', textAlign: 'left' }}>
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
                        Administrative Control
                    </div>
                    <h1 className="title-font" style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                        System Overview
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Manage health professionals, patient verifications, and platform security.
                    </p>
                </div>

                {/* Stats Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                    <Card padding="32px">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Verified Doctors</h3>
                                <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary)' }}>{stats.doctors}</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Stethoscope size={20} color="var(--primary)" />
                            </div>
                        </div>
                    </Card>
                    <Card padding="32px">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Active Nurses</h3>
                                <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--success)' }}>{stats.nurses}</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0, 209, 160, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} color="var(--success)" />
                            </div>
                        </div>
                    </Card>
                    <Card padding="32px">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Verified Patients</h3>
                                <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent)' }}>{stats.patients}</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LayoutDashboard size={20} color="var(--accent)" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div style={{ marginBottom: '32px', maxWidth: '480px' }}>
                    <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Tabs tabs={tabs} />
            </div>
        </div>
    );
};

export default AdminDashboard;
