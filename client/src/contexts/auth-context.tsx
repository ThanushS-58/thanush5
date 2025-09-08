import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('auth-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Verify user is still valid by fetching fresh data
          const response = await apiRequest('GET', `/api/users/${userData.id}`);
          if (response.ok) {
            const freshUser = await response.json();
            setUser(freshUser);
          } else {
            localStorage.removeItem('auth-user');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth-user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // For demo purposes, we'll simulate login by finding user by email
      // In production, this would be a proper authentication endpoint
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (name: string, email: string, username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', {
        name,
        email,
        username,
        password,
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}