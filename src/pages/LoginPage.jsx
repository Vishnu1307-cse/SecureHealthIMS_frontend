import React from 'react';
// UI note: Login page layout tuned for patient portal entry.
// TODO: Consider adding quick links for password reset here.
// META: Additional UX ideas can be tracked in frontend.md.
import LoginForm from '../components/auth/LoginForm';
import Card from '../components/ui/Card';
import Navbar from '../components/layout/Navbar';

const LoginPage = () => {
    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            <Navbar />
            <div className="animate-fade-in" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 'calc(100vh - 100px)',
                padding: '24px'
            }}>
                <div style={{ width: '100%', maxWidth: '440px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div
                            className="float-subtle"
                            style={{
                                display: 'inline-block',
                                background: 'var(--primary-glow)',
                                color: 'var(--primary)',
                                padding: '12px 24px',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '13px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '3px',
                                marginBottom: '24px',
                                border: '1px solid var(--primary-glow)',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                            }}
                        >
                            Welcome Back
                        </div>
                        <h1 className="title-font text-shimmer text-reveal" style={{
                            fontSize: '4.5rem',
                            fontWeight: 900,
                            marginBottom: '16px',
                            letterSpacing: '-2px',
                            lineHeight: 1.1
                        }}>
                            Patient Portal
                        </h1>
                        <p className="animate-fade-in" style={{
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            maxWidth: '100%',
                            margin: '0 auto',
                            opacity: 0.8,
                            animationDelay: '0.4s'
                        }}>
                            Access your medical reports and consultation history with ease.
                        </p>
                    </div>
                    <Card style={{
                        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                        border: '1px solid var(--glass-highlight)'
                    }}>
                        <LoginForm />
                    </Card>
                    <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Secure & Encrypted HIPAA Compliant Platform
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
