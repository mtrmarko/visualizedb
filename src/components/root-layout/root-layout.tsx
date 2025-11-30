import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/auth-context';

const useBackend = import.meta.env.VITE_USE_BACKEND === 'true';

export const RootLayout: React.FC = () => {
    if (useBackend) {
        return (
            <AuthProvider>
                <Outlet />
            </AuthProvider>
        );
    }

    return <Outlet />;
};
