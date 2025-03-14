import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * Create an axios instance with default configuration
 */
const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "https://localhost:5001/api",
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request token from the backend API using user's credentials
 */
/**
 * Sends a POST request to the specified endpoint with the given payload to request a token.
 *
 * @template T - The expected response type.
 * @param {string} endpoint - The API endpoint to send the request to.
 * @param {any} payload - The payload to be sent in the request body.
 * @returns {Promise<T>} - A promise that resolves to the response data of type T.
 * @throws {Error} - Throws an error if the API request fails.
 */
export async function requestTokenAPI<T>(
    endpoint: string,
    payload: any
): Promise<T> {
    try {
        const config: AxiosRequestConfig = {
            url: endpoint,
            method: "POST",
            data: payload,
        };

        const response: AxiosResponse<T> = await apiClient(config);
        return response.data;
    } catch (error: any) {
        console.error("API Request Failed:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Failed to request token.");
    }
}