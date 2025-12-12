import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/auth-context';
import { backendEnabled } from '@/config/app-config';

export const RootLayout: React.FC = () => {
    if (backendEnabled) {
        return (
            <AuthProvider>
                <Outlet />
            </AuthProvider>
        );
    }

    return <Outlet />;
};
