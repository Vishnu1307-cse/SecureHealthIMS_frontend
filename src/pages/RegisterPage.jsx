import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import Card from '../components/ui/Card';
import Navbar from '../components/layout/Navbar';

const RegisterPage = () => {
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
                <div style={{ width: '100%', maxWidth: '520px' }}>
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
                            Join CuraLink
                        </div>
                        <h1 className="title-font text-shimmer text-reveal main-title" style={{
                            fontSize: '4.5rem',
                            fontWeight: 900,
                            marginBottom: '16px',
                            letterSpacing: '-2px',
                            lineHeight: 1.1
                        }}>
                            Begin Journey
                        </h1>
                        <p className="animate-fade-in" style={{
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            maxWidth: '100%',
                            margin: '0 auto',
                            opacity: 0.8,
                            animationDelay: '0.4s'
                        }}>
                            Create your account to start managing your health journey today.
                        </p>
                    </div>
                    <Card style={{
                        boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                        border: '1px solid var(--glass-highlight)'
                    }}>
                        <RegisterForm />
                    </Card>
                </div>
            </div>
            <style>{`
                @media (max-width: 768px) {
                    .main-title {
                        fontSize: 2.5rem !important;
                        letter-spacing: -1px !important;
                    }
                    div[style*="min-height: calc(100vh - 100px)"] {
                        min-height: auto !important;
                        padding-top: 40px !important;
                        padding-bottom: 40px !important;
                    }
                    div[style*="margin-bottom: 48px"] {
                        margin-bottom: 32px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;
