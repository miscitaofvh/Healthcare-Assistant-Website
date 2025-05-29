export const config = {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    API_BASE_PATH: '/api',
};

export const getApiUrl = (path: string = '') => {
    return `${config.API_URL}${config.API_BASE_PATH}${path}`;
}; 