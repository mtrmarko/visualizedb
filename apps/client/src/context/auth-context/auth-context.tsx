import { createContext } from 'react';
import type { User } from '../../services/auth.service';

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);
