import { jwtDecode } from 'jwt-decode';

export type UserToken = { iat: number, userId: number; firstName: string; lastName: string };

export function storeToken(tok: any): boolean 
{
    try {
        localStorage.setItem('token_data', tok.accessToken);
        return true;
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

export function retrieveToken(): any 
{
    let ud;
    try {
        ud = localStorage.getItem('token_data');
    }
    catch (e) {
        console.log(e);
    }
    return ud;
}

// Used for logout
export function clearToken(): boolean 
{
    try {
        localStorage.removeItem('token_data');
        localStorage.removeItem('user_data');
        return true;
    }
    catch (e) {
        console.log(e);
        return false;
    }
}

// Verify token is valid and isnt expired.
// Perhaps, it should be called each time the page is changed.

// Tokens are fetched from localStorage. Users can spoof them easily.
// For critical checks (like login), use the API functions.
export function validToken(): boolean 
{
    const tok = retrieveToken();

    if (!tok) return false;

    try 
    {
        const { exp } = jwtDecode(tok);
        
        return exp !== undefined && exp * 1000 > Date.now();
    }
    catch (e) 
    {
        console.log(e);
        return false;
    }
}