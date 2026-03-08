import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, setAuthToken } from '../services/authApi';

export interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, userData: User, rememberMe?: boolean) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const login = (newToken: string, userData: User, rememberMe = true) => {
        setToken(newToken);
        setUser(userData);
        if (rememberMe) {
            localStorage.setItem('@FisioSim:token', newToken);
            sessionStorage.removeItem('@FisioSim:token');
        } else {
            sessionStorage.setItem('@FisioSim:token', newToken);
            localStorage.removeItem('@FisioSim:token');
        }
        setAuthToken(newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('@FisioSim:token');
        sessionStorage.removeItem('@FisioSim:token');
        setAuthToken(null);
    };

    const checkAuth = async () => {
        setIsLoading(true);
        const storedToken = localStorage.getItem('@FisioSim:token') || sessionStorage.getItem('@FisioSim:token');

        if (storedToken) {
            setAuthToken(storedToken);
            try {
                const response = await authApi.get('/auth/me');
                if (response.data && response.data.user) {
                    setToken(storedToken);
                    setUser(response.data.user);
                } else {
                    logout();
                }
            } catch (err) {
                console.error('Erro ao validar token:', err);
                logout();
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
