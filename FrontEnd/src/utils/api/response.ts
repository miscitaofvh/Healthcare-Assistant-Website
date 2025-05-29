import { AxiosResponse } from "axios";

/**
 * Standard API Response format
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}

/**
 * Handles API success responses
 * @param response - Axios response object
 * @returns A standardized response object
 */
export function handleSuccess<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
        success: true,
        data: response.data,
        message: "Request successful",
    };
}

/**
 * Handles API error responses
 * @param error - Axios error object
 * @returns A standardized error object
 */
export function handleError(error: any): ApiResponse {
    let message = "An unknown error occurred";
    
    if (error.response) {
        // Server responded with a status other than 2xx
        message = error.response.data?.message || `Error: ${error.response.status}`;
    } else if (error.request) {
        // No response received from the server
        message = "No response from server. Please check your connection.";
    } else {
        // Request setup error
        message = error.message;
    }

    console.error("API Error:", message);
    
    return {
        success: false,
        error,
        message,
    };
}