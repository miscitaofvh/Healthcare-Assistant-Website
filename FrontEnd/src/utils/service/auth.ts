import { requestAPI } from "../api/request";
const BASE_URL = "http://localhost:5000/api/auth";

export async function login(identifier: string, password: string) {
    // Determine if the identifier is an email or a username
    const requestData: any = { password };
    if (identifier.includes("@")) {
        requestData.email = identifier;
    } else {
        requestData.username = identifier;
    }

    try {
        const response = await requestAPI(BASE_URL, "/login", "POST", requestData);
        const { data, status } = response;

        if (status === 200 && data.success) {
            localStorage.setItem("token", data.token);
            return { success: true, message: "Login successful!" };
        } else {
            return { success: false, message: data.error || "Login failed" };
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.error || "Login failed",
            status: error.response?.status || 500, // Capture status code
        };
    }
}

export async function register(username: string, email: string, password: string) {
    try {
        const response = await requestAPI(BASE_URL, "/register", "POST", { username, email, password });
        const { data, status } = response;

        if (status === 201 && data.success) {
            return { success: true, message: "Registration successful!" };
        } else {
            return { success: false, message: data.error || "Registration failed" };
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.error || "Registration failed",
            status: error.response?.status || 500, // Capture status code
        };
    }
}