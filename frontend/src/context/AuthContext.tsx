import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  completePasswordChange: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedMustChange = localStorage.getItem('mustChangePassword');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Check if password change is required
      setMustChangePassword(storedMustChange === 'true' || parsedUser.mustChangePassword === true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    const { token: newToken, user: newUser } = response.data.data;
    
    // Check mustChangePassword from user object (backend includes it there)
    const needsChange = newUser.mustChangePassword === true;
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Store password change requirement
    if (needsChange) {
      localStorage.setItem('mustChangePassword', 'true');
      setMustChangePassword(true);
    } else {
      localStorage.removeItem('mustChangePassword');
      setMustChangePassword(false);
    }
    
    setToken(newToken);
    setUser(newUser);
  };

  const completePasswordChange = () => {
    // Clear the password change requirement
    localStorage.removeItem('mustChangePassword');
    setMustChangePassword(false);
    
    // Update user object
    if (user) {
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChangePassword');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, mustChangePassword, login, logout, completePasswordChange, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
