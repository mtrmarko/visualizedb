import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './auth-context';
import { authService, type User } from '../../services/auth.service';
import { setAccessToken } from '../../services/api-client';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const refreshAuth = useCallback(async () => {
        try {
            const newToken = await authService.refreshToken();
            setToken(newToken);

            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch {
            // No valid refresh token, user needs to login
            setUser(null);
            setToken(null);
            setAccessToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            setIsLoading(true);
            try {
                const response = await authService.login(email, password);
                setUser(response.user);
                setToken(response.token);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        },
        [navigate]
    );

    const signup = useCallback(
        async (email: string, password: string) => {
            setIsLoading(true);
            try {
                const response = await authService.signup(email, password);
                setUser(response.user);
                setToken(response.token);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        },
        [navigate]
    );

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } finally {
            setUser(null);
            setToken(null);
            setAccessToken(null);
            navigate('/login');
        }
    }, [navigate]);

    // Try to refresh token on mount
    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

    // Listen for logout events from API client
    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
            setToken(null);
            setAccessToken(null);
            navigate('/login');
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [navigate]);

    const value = {
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshAuth,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
