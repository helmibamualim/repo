const TIMEOUT = 15000; // 15 detik

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Verify token is still valid
          const response = await fetch('/api/auth/verify-token', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and storage regardless of API call result
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast.success('Berhasil logout');
      router.push('/login');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        toast.error('Silakan login terlebih dahulu');
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-white">Memuat...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect in useEffect
    }

    return <WrappedComponent {...props} />;
  };
}

// Hook for API calls with authentication
export function useAuthenticatedFetch() {
  const { token, logout } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
      logout();
      return null;
    }

    return response;
  };

  return authenticatedFetch;
}
