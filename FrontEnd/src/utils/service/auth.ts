import { requestAPI } from "../api/request";
import { getApiUrl } from '../../config/env';

const BASE_URL = getApiUrl('/auth');

export async function register(username: string, email: string, password: string) {
    try {
        const response = await requestAPI(BASE_URL, "/register", "POST", { username, email, password });
        const { data, status } = response;

        if (status === 201 && data.success) {
            return { 
                success: true, 
                message: data.message || "Registration successful!",
                data: data
            };
        } else {
            return { 
                success: false, 
                message: data.errors[0].msg || "Registration failed",
                data: data
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.error || "Registration failed",
            status: error.response?.status || 500, // Capture status code
        };
    }
}