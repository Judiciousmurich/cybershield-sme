import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api';
import type { PublicUser } from '../types';

const TOKEN_KEY = 'cybershield.token';
const USER_KEY = 'cybershield.user';

type AuthContextValue = {
  token: string | null;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateBusinessContext: (businessContext: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): PublicUser | null {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<PublicUser | null>(readStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ token: string; user: PublicUser }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: { email, password },
      },
    );
    sessionStorage.setItem(TOKEN_KEY, result.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string) => {
      await api('/api/auth/register', {
        method: 'POST',
        body: { email, password },
      });
      await login(email, password);
    },
    [login],
  );

  const updateBusinessContext = useCallback(
    async (businessContext: string) => {
      const result = await api<{ user: PublicUser }>('/api/auth/me', {
        method: 'PATCH',
        token,
        body: { business_context: businessContext },
      });
      sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
      setUser(result.user);
    },
    [token],
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('cybershield.assessmentId');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, login, register, updateBusinessContext, logout }),
    [token, user, login, register, updateBusinessContext, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
