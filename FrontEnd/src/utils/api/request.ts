import axios from "axios";

const API_BASE_URL = "https://your-api.com";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        apiClient.defaults.headers["Authorization"] = `Bearer ${token}`;
    } else {
        delete apiClient.defaults.headers["Authorization"];
    }
};
