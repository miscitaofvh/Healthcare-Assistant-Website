import { createContext, useState, ReactNode, useEffect } from "react";
import { requestAPI } from "../utils/api/request";
import { useContext } from "react";

const BASE_URL = "http://localhost:5000/api";
interface User {
    user_id: string;
    username: string;
    email: string;
  }

interface AuthContextType {
    user: User | null;
    checkAuth: () => Promise<void>;
    login: (identifier: string, password: string) => Promise<any>;
    logout: () => void;
}


export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const checkAuth = async () => {
        try {
            const response = await requestAPI(BASE_URL, "/auth/me", "GET");
            const { data, status } = response;
            //console.log(data);
            if (data.success === true)
                setUser(data.user);
            else
                setUser(null);
        } catch (error) {
            setUser(null);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (identifier: string, password: string) => {
        try {
            const response = await requestAPI(BASE_URL, "/auth/login", "POST", { identifier, password });
            const { data, status } = response;
            if (status === 200 && data.success) {
                await checkAuth();
                return {
                    success: true,
                    message: data.message || "Login successful!",
                    data: data
                };
            }
            else {
                return {
                    success: false,
                    message: data.errors[0].msg || "Login failed",
                    data: data
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.error || "Login failed",
                status: error.response?.status || 500,
            };
        }
    };

    const logout = async () => {
        const response = await requestAPI(BASE_URL, "/auth/logout", "POST", {});
        const { data, status } = response;
        if (status === 200 && data.success) 
            setUser(null);
        else 
            console.error("Logout failed", data);
    };

    return (
        <AuthContext.Provider value={{ checkAuth, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
