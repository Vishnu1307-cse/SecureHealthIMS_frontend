import React, { useState } from 'react';

const Select = ({ label, name, value, onChange, required = false, error, children, ...props }) => {
    const [focused, setFocused] = useState(false);

    return (
        <div style={{ marginBottom: '24px', width: '100%' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: focused ? 'var(--primary)' : 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'all 0.3s ease'
                }}>
                    {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: error ? 'var(--danger)' : (focused ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'),
                        backgroundColor: focused ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(16px)',
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                        boxShadow: focused ? '0 0 25px rgba(var(--primary-rgb), 0.3)' : 'none',
                        appearance: 'none',
                        cursor: 'pointer',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                        backgroundSize: '16px',
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...props}
                >
                    {children}
                </select>
                {/* Adding default CSS to option tags here isn't fully supported via inline styles on select, so we expect options to look dark inherited from wrapper in supported browsers, or use OS defaults */}
                {error && (
                    <span style={{
                        display: 'block',
                        marginTop: '6px',
                        fontSize: '12px',
                        color: 'var(--danger)',
                        fontWeight: 500
                    }}>
                        {error}
                    </span>
                )}
            </div>
            <style>{`
                select option {
                    background-color: #0f172a; /* dark slate bg */
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default Select;
