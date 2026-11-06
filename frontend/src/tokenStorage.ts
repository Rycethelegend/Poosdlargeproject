import { jwtDecode } from 'jwt-decode';

export type UserToken = { userId: string; username: string; iat: number; exp: number };

const TOKEN_KEY = 'token_data';

export function storeToken(accessToken: string): boolean {
    try {
        localStorage.setItem(TOKEN_KEY, accessToken);
        return true;
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

export function retrieveToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

// Used for logout
export function clearToken(): boolean {
    try {
        localStorage.removeItem(TOKEN_KEY);
        return true;
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

// The logged-in user's details, or null when not logged in or the token has expired.
// Tokens live in localStorage, so users can edit them. This is only for deciding
// what to show; the server checks the token again on every protected API call.
export function getUser(): UserToken | null {
    const tok = retrieveToken();
    if (!tok) return null;

    try {
        const user = jwtDecode<UserToken>(tok);
        return user.exp * 1000 > Date.now() ? user : null;
    }
    catch (e) {
        console.log(e);
        return null;
    }
}

export function validToken(): boolean {
    return getUser() !== null;
}
