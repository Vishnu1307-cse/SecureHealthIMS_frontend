import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { FileText, Eye, User, Calendar, Clock, Filter, Search } from 'lucide-react';

const AuditLogs = ({ isAdmin = false }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        action: '',
        from_date: '',
        to_date: '',
        limit: 50,
        offset: 0
    });
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        fetchAuditLogs();
    }, [filters]);

    const fetchAuditLogs = async () => {
        setLoading(true);
        setError('');

        try {
            const endpoint = isAdmin ? '/audit/all' : '/audit/me';
            const params = new URLSearchParams();

            if (filters.action) params.append('action', filters.action);
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);
            params.append('limit', filters.limit.toString());
            params.append('offset', filters.offset.toString());

            const res = await api.get(`${endpoint}?${params}`);

            if (res.data.success) {
                setLogs(res.data.data.logs || []);
                setSummary(res.data.data.summary || null);
            } else {
                setError('Failed to fetch audit logs');
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
            setError(err.response?.data?.error?.message || 'Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            offset: 0 // Reset pagination when filters change
        }));
    };

    const handlePageChange = (direction) => {
        setFilters(prev => ({
            ...prev,
            offset: Math.max(0, prev.offset + (direction * prev.limit))
        }));
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'READ': return 'var(--accent)';
            case 'CREATE': return 'var(--success)';
            case 'UPDATE': return 'var(--warning)';
            case 'DELETE': return 'var(--danger)';
            default: return 'var(--text-secondary)';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatConversationalLog = (log) => {
        const role = log.details?.role ? log.details.role.charAt(0).toUpperCase() + log.details.role.slice(1) : 'Staff member';
        const name = log.user_name || 'Someone';
        
        let action = 'viewed';
        if (log.action === 'CREATE') {
            if (log.resource === 'appointment') action = 'made an appointment for';
            else if (log.resource.includes('prescription')) action = 'prescribed for';
            else action = 'created';
        } else if (log.action === 'UPDATE') {
            action = 'updated';
        } else if (log.action === 'DELETE') {
            action = 'deleted';
        }
        
        let target = 'your data';
        switch (log.resource) {
            case 'patient_profile':
                target = 'your profile';
                break;
            case 'medical_records_list':
                target = 'your medical records';
                break;
            case 'medical_record_detail':
                target = 'a specific medical record of yours';
                break;
            case 'prescriptions_list':
                target = 'your prescriptions';
                break;
            case 'prescription_detail':
                target = 'a specific prescription of yours';
                break;
            case 'appointment':
                target = 'you';
                break;
        }

        return `${role}: ${name}, ${action} ${target}.`;
    };

    if (loading && logs.length === 0) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                        <FileText size={48} style={{ opacity: 0.5 }} />
                    </div>
                    <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading audit logs...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
                    <FileText size={48} style={{ opacity: 0.5 }} />
                    <p style={{ marginTop: '16px' }}>{error}</p>
                    <Button onClick={fetchAuditLogs} style={{ marginTop: '16px' }}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Summary Card (for patients) */}
            {summary && !isAdmin && (
                <Card>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        <Eye size={20} style={{ marginRight: '8px', color: 'var(--accent)' }} />
                        Recent Access Summary
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                        {summary.note}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {summary.recent_access?.slice(0, 6).map((access, index) => (
                            <div key={index} style={{
                                padding: '12px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)'
                            }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    <Clock size={12} style={{ display: 'inline', marginRight: '4px', position: 'relative', top: '-1px' }} />
                                    {formatDate(access.created_at)}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {formatConversationalLog(access)}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Filters (Admin Only) */}
            {isAdmin && (
                <Card>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                        <Filter size={20} style={{ marginRight: '8px' }} />
                        Filters
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                                Action Type
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">All Actions</option>
                                <option value="READ">Read</option>
                                <option value="CREATE">Create</option>
                                <option value="UPDATE">Update</option>
                                <option value="DELETE">Delete</option>
                            </select>
                        </div>
                        <Input
                            label="From Date"
                            type="date"
                            value={filters.from_date}
                            onChange={(e) => handleFilterChange('from_date', e.target.value)}
                        />
                        <Input
                            label="To Date"
                            type="date"
                            value={filters.to_date}
                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                        />
                        <Button onClick={() => setFilters({ action: '', from_date: '', to_date: '', limit: 50, offset: 0 })}>
                            Clear Filters
                        </Button>
                    </div>
                </Card>
            )}

            {/* Audit Logs List */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        <FileText size={20} style={{ marginRight: '8px' }} />
                        Audit Logs ({logs.length})
                    </h3>
                    <Button variant="secondary" size="sm" onClick={fetchAuditLogs}>
                        <Search size={16} style={{ marginRight: '8px' }} />
                        Refresh
                    </Button>
                </div>

                {logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                        <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                        <p>No audit logs found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {logs.map((log) => (
                            <div key={log.id} style={{
                                padding: '16px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                display: isAdmin ? 'grid' : 'flex',
                                gridTemplateColumns: isAdmin ? 'auto 1fr auto' : 'none',
                                flexDirection: isAdmin ? 'row' : 'column',
                                gap: '16px',
                                alignItems: isAdmin ? 'center' : 'flex-start'
                            }}>
                                {/* Admin Technical View */}
                                {isAdmin ? (
                                    <>
                                        {/* Action Badge */}
                                        <div style={{
                                            padding: '6px 12px',
                                            borderRadius: 'var(--radius-full)',
                                            backgroundColor: `${getActionColor(log.action)}20`,
                                            color: getActionColor(log.action),
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            minWidth: '70px'
                                        }}>
                                            {log.action}
                                        </div>

                                        {/* Log Details */}
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                                                {log.resource} {log.resource_id && `(${log.resource_id})`}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} />
                                                    {formatDate(log.created_at)}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <User size={12} />
                                                    {log.user_name || log.user_id}
                                                </span>
                                                {log.patient_name && (
                                                    <span>Patient: {log.patient_name}</span>
                                                )}
                                            </div>
                                            {log.details && (
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                    {log.details.method && `Method: ${log.details.method}`}
                                                    {log.details.path && ` | Path: ${log.details.path}`}
                                                </div>
                                            )}
                                        </div>

                                        {/* IP Address */}
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                            IP: {log.ip_address}
                                        </div>
                                    </>
                                ) : (
                                    /* Patient Conversational View */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formatConversationalLog(log)}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} />
                                            {formatDate(log.created_at)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {logs.length >= filters.limit && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
                        <Button
                            variant="secondary"
                            onClick={() => handlePageChange(-1)}
                            disabled={filters.offset === 0}
                        >
                            Previous
                        </Button>
                        <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>
                            Page {Math.floor(filters.offset / filters.limit) + 1}
                        </span>
                        <Button
                            variant="secondary"
                            onClick={() => handlePageChange(1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AuditLogs;