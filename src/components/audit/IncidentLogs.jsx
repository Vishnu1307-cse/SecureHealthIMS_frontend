import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ShieldAlert, Clock, Info } from 'lucide-react';

const IncidentLogs = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/admin/incidents');
            if (res.data.success) {
                setIncidents(res.data.data || []);
            } else {
                setError('Failed to fetch incident logs');
            }
        } catch (err) {
            console.error('Error fetching incident logs:', err);
            setError(err.response?.data?.error?.message || 'Failed to fetch incident logs');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'var(--danger)';
            case 'high': return 'var(--danger)';
            case 'medium': return 'var(--warning)';
            case 'low': return 'var(--success)';
            default: return 'var(--text-secondary)';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading && incidents.length === 0) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                        <ShieldAlert size={48} style={{ opacity: 0.5 }} />
                    </div>
                    <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading security incidents...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
                    <ShieldAlert size={48} style={{ opacity: 0.5 }} />
                    <p style={{ marginTop: '16px' }}>{error}</p>
                    <Button onClick={fetchIncidents} style={{ marginTop: '16px' }}>
                        Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', color: 'var(--danger)' }}>
                        <ShieldAlert size={20} style={{ marginRight: '8px' }} />
                        Security Incidents & Suspicious Access ({incidents.length})
                    </h3>
                    <Button variant="secondary" size="sm" onClick={fetchIncidents}>
                        Refresh
                    </Button>
                </div>

                {incidents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                        <ShieldAlert size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                        <p>No security incidents or suspicious access attempts found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {incidents.map((incident) => (
                            <div key={incident.id} style={{
                                padding: '16px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto',
                                gap: '16px',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: `${getSeverityColor(incident.severity)}20`,
                                    color: getSeverityColor(incident.severity),
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    minWidth: '80px',
                                    textTransform: 'uppercase'
                                }}>
                                    {incident.severity}
                                </div>

                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                                        {incident.event_type}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {formatDate(incident.created_at)}
                                        </span>
                                    </div>
                                    {incident.details && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', background: 'var(--bg-primary)', padding: '8px', borderRadius: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                                <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                                                    {JSON.stringify(incident.details, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                                    {incident.ip_address && <div>IP: {incident.ip_address}</div>}
                                    {incident.user_agent && <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={incident.user_agent}>UA: {incident.user_agent}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default IncidentLogs;
