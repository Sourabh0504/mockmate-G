import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore and validate session from localStorage on app load
        const savedToken = localStorage.getItem('mm_token');
        const savedUser = localStorage.getItem('mm_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            // Validate the token is still accepted by the backend
            authApi.me()
                .then((res) => {
                    // Refresh user data from backend (in case profile was updated)
                    setUser(res.data);
                    localStorage.setItem('mm_user', JSON.stringify(res.data));
                })
                .catch(() => {
                    // Token expired or revoked — clear session
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem('mm_token');
                    localStorage.removeItem('mm_user');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (tokenValue, userData) => {
        setToken(tokenValue);
        setUser(userData);
        localStorage.setItem('mm_token', tokenValue);
        localStorage.setItem('mm_user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('mm_token');
        localStorage.removeItem('mm_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
