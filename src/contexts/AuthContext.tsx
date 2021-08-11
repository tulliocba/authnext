import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import Router from "next/router";
import { setCookie, parseCookies, destroyCookie } from "nookies";

type User = {
    email: string;
    permissions: string[];
    roles: string[];

}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signOut: () => void;
    user: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode
}

let authChannel: BroadcastChannel;

export function signOut() {
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');

    authChannel.postMessage('signOut');

    Router.push('/');
}

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {

    const [user, setUser] = useState<User>(null);

    const isAuthenticated = !!user;

    useEffect(() => {

        authChannel = new BroadcastChannel('auth');
        
        authChannel.onmessage = (message) => {
            switch (message.data) {
                case 'signOut':
                    signOut();
                    break;
                case 'signIn':
                    console.log(`SignIn Message: ${message.data}`);
                    break;
                default:
                    break;
            }
        }
    }, [])

    useEffect(() => {
        const { 'nextauth.token': token } = parseCookies();

        if (token) {
            api.get('/me')
                .then(response => {
                    const { email, permissions, roles } = response.data;
                    setUser({ email, permissions, roles });
                })
                .catch(error => {
                    if (process.browser) {
                        signOut();
                    }
                });
        }

    }, []);

    const signIn = async ({ email, password }: SignInCredentials) => {
        try {
            const { data: { permissions, roles, token, refreshToken } } = await api.post('sessions', { email, password });

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30,  // 30 Days
                path: '/'
            });
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30,  // 30 Days
                path: '/'
            });

            setUser({
                email,
                permissions,
                roles
            });

            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            // authChannel.postMessage('signIn');

            Router.push('/dashboard');
        } catch (err) {
            console.log(`Error signIn ${err}`);
        }

    }

    return (
        <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);