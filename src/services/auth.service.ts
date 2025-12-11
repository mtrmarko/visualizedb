import { apiClient, setAccessToken } from './api-client';
import type { AuthResponse, User } from '@shared/api-types';
export type { AuthResponse, User } from '@shared/api-types';

export const authService = {
    async signup(email: string, password: string): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/signup', {
            email,
            password,
        });
        setAccessToken(response.data.token);
        return response.data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/login', {
            email,
            password,
        });
        setAccessToken(response.data.token);
        return response.data;
    },

    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            setAccessToken(null);
        }
    },

    async refreshToken(): Promise<string> {
        const response = await apiClient.post<{ token: string }>(
            '/auth/refresh'
        );
        setAccessToken(response.data.token);
        return response.data.token;
    },

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<{ user: User }>('/auth/me');
        return response.data.user;
    },
};
