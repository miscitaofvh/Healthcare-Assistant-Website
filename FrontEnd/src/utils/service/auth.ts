import { requestAPI } from "../api/request";
import {isEmail} from "../format/email";
const BASE_URL = "http://localhost:5000/api/auth";

export async function login(email: string, password: string) {
    if(isEmail(email) === false){
        alert("Please enter a valid email address.");
        return;
    }
    try {
        const response = await requestAPI(BASE_URL, "/login", "POST", {
            email,
            password,
        });

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