import React, { createContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface AuthContextType {
    user: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const navigate = useNavigate();

    const login = async (username: string, password: string) => {
        try {
            console.log("Sending login request:", { username, password });

            const response = await axios.post("http://localhost:5000/api/login", {
                username,
                password,
            });
            console.log("Login response:", response.data);
            if (response.data.success) {
                console.log("Login successful:", response.data);
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
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
