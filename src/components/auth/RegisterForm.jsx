import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../ui/Input';
import Button from '../ui/Button';

const RegisterForm = () => {
    const { initiateRegister, verifyRegister } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [otp, setOtp] = useState('');

    const [role, setRole] = useState('patient');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        address: '',
        role: 'patient',
        // Patient specific
        date_of_birth: '',
        gender: 'male',
        // Doctor specific
        specialization: '',
        department_id: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setRole(newRole);
        setFormData({ ...formData, role: newRole });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (step === 1) {
            // STEP 1: Initiate registration (send OTP)
            const res = await initiateRegister(formData.email, formData.password);
            if (res.success) {
                setStep(2);
            } else {
                setError(res.message);
            }
        } else {
            // STEP 2: Verify OTP and complete registration
            const payload = { ...formData, token: otp };

            // Helper regex for UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (role === 'patient') {
                delete payload.specialization;
                delete payload.department_id;
            } else if (role === 'doctor') {
                delete payload.date_of_birth;
                delete payload.gender;

                if (payload.department_id && payload.department_id.trim() !== '') {
                    if (!uuidRegex.test(payload.department_id)) {
                        setError('Department ID must be a valid UUID');
                        setLoading(false);
                        return;
                    }
                } else {
                    delete payload.department_id;
                }
            }

            const res = await verifyRegister(payload);

            if (res.success) {
                if (role === 'doctor') {
                    alert("Registration successful! Your account is pending admin approval.");
                } else {
                    alert("Registration successful! Please login.");
                }
                navigate('/login');
            } else {
                setError(res.message);
            }
        }
        setLoading(false);
    };

    if (step === 2) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Verify Your Email
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        We've sent an 8-digit code to <br />
                        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{formData.email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {error && (
                        <div style={{ padding: '12px', backgroundColor: 'rgba(255, 59, 48, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <Input
                        label="Verification Code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        placeholder="12345678"
                        maxLength={8}
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: 700 }}
                    />

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Verifying...' : 'Complete Registration'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Change Email / Back
                    </button>
                </form>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(255, 59, 48, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* Role Selection */}
            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    Register as a:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['patient', 'doctor'].map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => handleRoleChange({ target: { value: r } })}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 'var(--radius-md)',
                                border: role === r ? '2px solid var(--accent)' : '1px solid var(--glass-stroke)',
                                backgroundColor: role === r ? 'rgba(0, 122, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                color: role === r ? 'var(--accent)' : 'var(--text-primary)',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                <Input label="Phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1..." />
            </div>

            <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
            <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="At least 8 characters" />

            <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="Street, City, State" />

            {role === 'patient' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Input label="Date of Birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--glass-stroke)',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-primary)',
                                fontSize: '15px',
                                outline: 'none',
                                height: '48px'
                            }}
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            )}

            {role === 'doctor' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Input label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} required placeholder="Cardiology" />
                    <Input label="Dept ID (Optional)" name="department_id" value={formData.department_id} onChange={handleChange} placeholder="UUID" />
                </div>
            )}

            <Button type="submit" fullWidth disabled={loading} style={{ marginTop: '16px', height: '52px' }}>
                {loading ? 'Sending Code...' : 'Continue to Verification'}
            </Button>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
            </div>
        </form>
    );
};

export default RegisterForm;
