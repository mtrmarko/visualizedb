/* eslint-disable @typescript-eslint/no-explicit-any */
export interface User {
    id: string;
    email: string;
    createdAt: number;
    updatedAt: number;
}

export interface AuthPayload {
    userId: string;
    email: string;
}

export interface SignupRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface DiagramVersion {
    id: string;
    diagramId: string;
    userId: string;
    versionName: string;
    description?: string;
    createdAt: number;
}

export interface CreateVersionRequest {
    versionName: string;
    description?: string;
}

export interface ApiError {
    error: string;
    details?: any;
}
