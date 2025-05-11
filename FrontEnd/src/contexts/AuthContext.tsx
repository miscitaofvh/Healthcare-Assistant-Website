import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
  } from "react";
  import { requestAPI } from "../utils/api/request";
  
  const BASE_URL = "http://localhost:5000/api";
  
  export interface User {
    user_id: string;
    username: string;
    email: string;
    role: "User" | "Doctor" | "Admin" | "Moderator";
    dob?: string; // Add date of birth for age calculation in health tracking
  }
  
  interface AuthContextType {
    user: User | null;
    authLoading: boolean;
    checkAuth: () => Promise<void>;
    login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
  };
  
  export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
  
    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        const { data, status } = await requestAPI(BASE_URL, "/auth/me", "GET");
        if (status === 200 && data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
  
    useEffect(() => {
      checkAuth();
    }, []);
  
    const login = async (identifier: string, password: string) => {
      try {
        const { data, status } = await requestAPI(BASE_URL, "/auth/login", "POST", { identifier, password });
        if (status === 200 && data.success) {
          await checkAuth();
          return { success: true, message: data.message || "Đăng nhập thành công" };
        }
        return { success: false, message: data.errors?.[0]?.msg || "Đăng nhập thất bại" };
      } catch (e: any) {
        return {
          success: false,
          message: e.response?.data?.error || "Đăng nhập thất bại",
        };
      }
    };
  
    const logout = async () => {
      try {
        const { data, status } = await requestAPI(BASE_URL, "/auth/logout", "POST", {});
        if (status === 200 && data.success) setUser(null);
      } catch (e) {
        console.error("Logout error", e);
      }
    };
  
    return (
      <AuthContext.Provider value={{ user, authLoading, checkAuth, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
  };