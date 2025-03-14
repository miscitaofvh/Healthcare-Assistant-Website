import { requestAPI } from "../api/request";

const baseurl_login = "https://localhost:5000/api/auth";

export const login = async (email: string, password: string) => {
    try {
        const { data } = await requestAPI(baseurl_login, "/login", "POST", {
            email,
            password,
        });

        if (data.success) {
            localStorage.setItem("token", data.token);
            return { success: true, message: "Login successful!" };
        } else {
            return { success: false, message: data.error };
        }
    } catch (error: any) {
        console.error("Error:", error.response?.data?.error || "Login failed");
        return { success: false, message: error.response?.data?.error || "Login failed" };
    }
};