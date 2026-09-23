import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
import axios from 'axios';
import { registerLogoutCallback, BACKEND_URL } from '../../services/apiService';

// Unified API Base URL
// Unified API Base URL
const API_BASE_URL = `${BACKEND_URL}/api`;

// Configure axios for credentials (cookies)
axios.defaults.withCredentials = true;

// --- Interfaces ---
interface User {
    user_id: string | number;
    name: string;
    lname: string;
    role_id: string | number;
    user_name: string;
    email?: string;
    role_name?: string;
    phone?: string;
    branch_id?: string | number | null;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

type AuthAction =
    | { type: 'INITIALIZE'; payload: { user: User | null } }
    | { type: 'LOGIN'; payload: { user: User } }
    | { type: 'LOGOUT' }
    | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextProps extends AuthState {
    login: (credentials: Record<string, any>) => Promise<{ success: boolean; message?: string; locked?: boolean; conflict?: boolean; session?: any }>;
    logout: () => Promise<void>;
    dispatch: React.Dispatch<AuthAction>;
    // Computed role flags
    isAdmin: boolean;
    isManager: boolean;
    isBarber: boolean;
    isReceptionist: boolean;
    isCustomer: boolean;
    isStaff: boolean;
}

// --- Initial State ---
const getInitialState = (): AuthState => {
    return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true, // Start in loading state until session is verified
    };
};

// --- Reducer ---
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'INITIALIZE':
            // Security: Ensure sensitive data is never left in localStorage from legacy versions
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
            return {
                ...state,
                user: action.payload.user,
                token: null,
                isAuthenticated: !!action.payload.user,
                isLoading: false,
            };
        case 'LOGIN':
            // Security: Ensure sensitive data is never persisted in localStorage
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
            return {
                ...state,
                user: action.payload.user,
                token: null,
                isAuthenticated: true,
                isLoading: false,
            };
        case 'LOGOUT':
            // Security: Ensure sensitive data is explicitly wiped
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        default:
            // Ensure exhaustive check or handle unknown action types
            const exhaustiveCheck: never = action;
            return state;
    }
};

// --- Context ---
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// --- Provider ---
interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, getInitialState());

    // --- Actions ---
    const login = useCallback(async (credentials: Record<string, any>): Promise<{ success: boolean; message?: string; locked?: boolean; conflict?: boolean; session?: any }> => {
        const cleanedCredentials = {
            ...credentials,
            user_name: typeof credentials.user_name === 'string' ? credentials.user_name.trim() : credentials.user_name
        };
        console.log("[AUTH] Login attempt with credentials:", JSON.stringify({ user_name: cleanedCredentials.user_name, pass: (cleanedCredentials as any).pass ? '***' : 'MISSING', forceLogout: (cleanedCredentials as any).forceLogout }));
        try {
            const response = await axios.post<{ success: boolean; token?: string; user?: User; message?: string; locked?: boolean; conflict?: boolean; session?: any }>(`${API_BASE_URL}/login`, cleanedCredentials, { 
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });


            if (response.data.success) {
                // SECURITY ENHANCEMENT: Fetch user data separately via protected /me endpoint
                // to avoid exposing sensitive info in the initial login response body.
                try {
                    const meResponse = await axios.get<{ success: boolean; user: User }>(`${API_BASE_URL}/me`, { withCredentials: true });
                    if (meResponse.data.success && meResponse.data.user) {
                        const { user } = meResponse.data;
                        dispatch({ type: 'LOGIN', payload: { user } });
                        return { success: true };
                    }
                } catch (meError) {
                    console.error("Failed to fetch user context after login:", meError);
                }

                // Fallback: If /me fails but login succeeded (unlikely but possible)
                return { success: false, message: "Authentication succeeded but session context could not be established." };
            } else {
                console.error("Login API Error:", response.data.message || 'Unknown login error');
                return {
                    success: false,
                    message: response.data.message || 'Login failed',
                    locked: response.data.locked,
                    conflict: response.data.conflict,
                    session: response.data.session
                };
            }
        } catch (error: any) {
            const status = error.response?.status as number | undefined;
            const errorData = error.response?.data as { message?: string; error?: string; locked?: boolean; conflict?: boolean; session?: any } | undefined;
            const message = errorData?.message || errorData?.error || error.message || "Login failed due to a network or server error.";
            const locked = errorData?.locked || false;
            const conflict = (status === 409) || (errorData?.conflict === true);
            const session = errorData?.session || null;

            return { success: false, message, locked, conflict, session };
        }
    }, []);

    const isLoggingOutRef = useRef(false);

    const logout = useCallback(async () => {
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;

        // Security: Ensure sensitive data is explicitly wiped locally
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }

        dispatch({ type: 'LOGOUT' });

        try {
            // Notifying the server to clear cookies and revoke token
            await axios.put(`${API_BASE_URL}/logout`, {}, { withCredentials: true, timeout: 4000 });
        } catch (error) {
            console.warn("[AUTH] Server-side logout notification completed or skipped:", error);
        } finally {
            setTimeout(() => {
                isLoggingOutRef.current = false;
            }, 1000);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
        const initializeAuth = async () => {
            // Priority: Clear any sensitive legacy data immediately
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }

            const checkSession = async (retries = 1): Promise<boolean> => {
                try {
                    const response = await axios.get<{ success: boolean; user: User }>(`${API_BASE_URL}/check-auth`, {
                        withCredentials: true,
                        timeout: 5000 // 5 second timeout
                    });
                    if (response.data.success) {
                        dispatch({ type: 'INITIALIZE', payload: { user: response.data.user } });
                        return true;
                    }
                } catch (error: any) {
                    console.warn(`[AUTH] Auth check failed${retries > 0 ? ', retrying...' : ''}`);
                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
                        return checkSession(retries - 1);
                    }
                }
                return false;
            };

            const authenticated = await checkSession();
            if (!authenticated) {
                dispatch({ type: 'INITIALIZE', payload: { user: null } });
            }
        };

        initializeAuth();

        // Register the logout callback to handle 401 Unauthorized responses (session expiration)
        registerLogoutCallback(() => {
            // console.warn("[AUTH] Session expired");
            logout();
        });

        // PASSIVE HEARTBEAT: Ping server periodically to detect background expiration
        const heartbeatInterval = setInterval(async () => {
            if (state.isAuthenticated && !state.isLoading) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/check-auth`, { withCredentials: true });
                    if (!response.data.success) {
                        console.warn("[AUTH] Passive heartbeat detected expired session.");
                        // Only logout if we are sure it's an auth failure, not a network error
                        logout();
                    }
                } catch (error: any) {
                    // Only logout on explicit 401 Unauthorized
                    if (error.response?.status === 401) {
                        console.warn("[AUTH] Passive heartbeat received 401. Logging out.");
                        logout();
                    }
                    // For status 0 (network block/timeout), we wait and don't logout immediately
                }
            }
        }, 300000); // Check every 5 minutes instead of 2 to reduce server load and noise

        return () => clearInterval(heartbeatInterval);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.isAuthenticated, logout]); // Run only once on mount, but restart or clear if auth changes

    // --- Context Value ---
    const roleId = Number(state.user?.role_id ?? 0);
    const contextValue: AuthContextProps = {
        ...state,
        login,
        logout,
        dispatch,
        // Computed role flags — avoids importing ROLES everywhere
        isAdmin:        roleId === 1,
        isBarber:       roleId === 2,
        isCustomer:     roleId === 3,
        isManager:      roleId === 4,
        isReceptionist: roleId === 5,
        isStaff:        [1, 2, 4, 5].includes(roleId),
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Hook ---
const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { AuthProvider, useAuth, AuthContext };
