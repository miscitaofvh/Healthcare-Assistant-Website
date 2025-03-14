import { requestAPI } from "../api/request";
import {isEmail} from "../format/email";
const BASE_URL = "http://localhost:5000/api/auth";

export async function login(identifier: string, password: string) {

    // Check if the identifier is an email or username
    const requestData: any = { password };
    if (identifier.includes("@")) {
        if (!isEmail(identifier)) {
            alert("Please enter a valid email");
            return { success: false, message: "Invalid email" };
        }
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