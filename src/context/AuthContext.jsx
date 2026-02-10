import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                // Fetch fresh user data from backend to ensure we have latest fields (like name/sync legacy data)
                if (parsedUser.token) {
                    try {
                        // We need to set the token in axios default headers or ensure it's attached
                        // api.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`; 
                        // Assuming axios interceptor handles it if token is in localStorage or variable, 
                        // but usually we might need to set it explicitly if not using cookies.
                        // Let's assume the axios instance configured in ../api/axios handles it OR we rely on the interceptor 
                        // reading from localStorage/variable. 
                        // If api/axios.js reads from localStorage, we are good.

                        // Safest to just call the endpoint. If it fails (401), we logout.
                        const res = await api.get('/auth/me');
                        if (res.data.success) {
                            const freshUser = { ...res.data.data, token: parsedUser.token };
                            setUser(freshUser);
                            localStorage.setItem('user', JSON.stringify(freshUser));
                        }
                    } catch (error) {
                        console.error('Failed to strict sync auth:', error);
                        // If 401, token expired
                        if (error.response && error.response.status === 401) {
                            localStorage.removeItem('user');
                            setUser(null);
                        }
                    }
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const userData = response.data.data;

            // Store minimal user info + token
            // Backend returns: { user: {...}, token: "..." }
            // We store everything for easy access
            const storageData = { ...userData.user, token: userData.token };

            setUser(storageData);
            localStorage.setItem('user', JSON.stringify(storageData));
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Login failed'
            };
        }
    };

    const initiateRegister = async (email, password) => {
        try {
            const response = await api.post('/auth/register/initiate', { email, password });
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Initiate registration failed:", error);
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Verification failed'
            };
        }
    };

    const verifyRegister = async (registrationData) => {
        try {
            const response = await api.post('/auth/register/verify', registrationData);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Verification failed:", error);
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const register = async (formData) => {
        // This is now deprecated in favor of initiate + verify
        return initiateRegister(formData.email, formData.password);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        // Optional: Call backend logout endpoint
        api.post('/auth/logout').catch(err => console.error("Backend logout error", err));
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.put('/auth/profile', data);

            if (response.data.success) {
                const updatedUser = { ...user, ...response.data.data };
                // Ensure token is preserved if not returned
                if (!updatedUser.token && user.token) {
                    updatedUser.token = user.token;
                }

                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return { success: true, message: response.data.message };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error("Profile update failed", error);
            return {
                success: false,
                message: error.response?.data?.error?.message || error.response?.data?.message || 'Update failed'
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, initiateRegister, verifyRegister, logout, updateProfile, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
