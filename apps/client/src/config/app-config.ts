export const backendEnabled =
    import.meta.env.VITE_USE_BACKEND === 'true' ||
    import.meta.env.VITE_USE_BACKEND === true;

export const apiBaseUrl =
    import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
