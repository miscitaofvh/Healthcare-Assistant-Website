import { requestAPI } from "../api/request";
const BASE_URL = "http://localhost:5000/api/auth";

export async function login(identifier: string, password: string) {

    // Check if the identifier is an email or username
    const requestData: any = { password };
    if (identifier.includes("@")) {
        requestData.email = identifier;
    }
    else {
        requestData.username = identifier;
    }

    try {
        const response = await requestAPI(BASE_URL, "/login", "POST", requestData);

        if (response.success) {
            localStorage.setItem("token", response.token);
            alert("Login successful!");
            return { success: true, message: "Login successful!" };
        } else {
            alert(response.error);
            return { success: false, message: response.error };
        }
    } catch (error: any) {
        alert(error.response?.response?.error || "Login failed");
    }
}

export async function register(username: string, email: string, password: string) {
    try {
        const response = await requestAPI(BASE_URL, "/register", "POST", { username, email, password });

        if (response.success) {
            alert("Registration successful!");
            return { success: true, message: "Registration successful!" };
        } else {
            alert(response.error);
            return { success: false, message: response.error };
        }
    } catch (error: any) {
        alert(error.response?.response?.error || "Registration failed");
    }
}