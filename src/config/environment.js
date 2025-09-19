// Environment configuration for lmsweb frontend
// This file helps manage different environments (development, production)

// Environment detection
export const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
export const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';

// Backend URL configuration
export const getBackendUrl = () => {
    // Check for environment variable first
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }
    
    // Production URL (Render deployment)
    if (isProduction) {
        return "https://lms-1-lavs.onrender.com/"; // ✅ Your actual Render URL
    }
    
    // Development URL
    return "http://localhost:7000/";
};

// External API configuration
export const getExternalApiConfig = () => ({
    baseUrl: import.meta.env.VITE_EXTERNAL_API_URL || "https://rootments.in/",
    token: import.meta.env.VITE_EXTERNAL_API_TOKEN || "RootX-production-9d17d9485eb772e79df8564004d4a4d4"
});

// CORS configuration
export const getCorsConfig = () => ({
    corsProxy: isDevelopment ? "https://cors-anywhere.herokuapp.com/" : null,
    forceLocalBackend: isDevelopment
});

export default {
    isDevelopment,
    isProduction,
    getBackendUrl,
    getExternalApiConfig,
    getCorsConfig
};
