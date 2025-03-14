import axios, { AxiosRequestConfig } from "axios";

/**
 * Create an axios instance with default configuration
 */
const apiClient = axios.create({
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Make an API request with proper configuration.
 * 
 * @param baseURL - The base API URL.
 * @param endpoint - The API endpoint (e.g., "/login", "/users").
 * @param method - The HTTP method (GET, POST, PUT, DELETE, etc.).
 * @param payload - The request body data (for POST/PUT).
 * @param token - Optional authentication token.
 * @returns A promise resolving to the API response data.
 */
export async function requestAPI(
    baseURL: string,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    payload?: any,
    token?: string | null
) {
    try {
        const config: AxiosRequestConfig = {
            baseURL,
            url: endpoint,
            method,
            data: payload,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        };

        const response = await apiClient(config);
        return response.data;
    } catch (error: any) {
        console.error("API Request Failed:", error.response?.data || error.message);
        throw error; // Re-throw error for handling in the calling function
    }
}