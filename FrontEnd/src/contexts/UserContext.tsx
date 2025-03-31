import React, { createContext, useState, useEffect, ReactNode } from 'react';
import API from '../utils/api/api';

// ✅ Define user interface
interface User {
    id: number;
    username: string;
    email: string;
}

// ✅ Define authentication context type
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// ✅ Create Context
export const UserContext = createContext<AuthContextType | null>(null);

// ✅ Context Provider Component
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch authenticated user on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data } = await API.get('/auth/me');
                setUser(data.user);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    // Login function
    const login = async (identifier: string, password: string) => {
        const { data } = await API.post('/auth/login', { identifier, password });
        setUser(data.user);
    };

    // Logout function
    const logout = async () => {
        await API.post('/auth/logout');
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};
