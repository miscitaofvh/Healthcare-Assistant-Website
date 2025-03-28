import React, { createContext, useState, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const BASE_URL = "http://localhost:5000";
interface AuthContextType {
    user: string | null;
    checkAuth: () => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const navigate = useNavigate();

        // Check if user is authenticated
        const checkAuth = async () => {
            try {
                const { data } = await axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true });
                setUser(data.user);
            } catch (error) {
                setUser(null);
            }
        };

        useEffect(() => {
            checkAuth(); // Run on mount
        }, []);

    const login = async (username: string, password: string) => {
        try {
            const response = await axios.post(`${BASE_URL}/api/login`, {
                username,
                password,
            });
            if (response.data.success) {
                setUser(username);
                localStorage.setItem("token", response.data.token);
                navigate("/")
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ checkAuth, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
