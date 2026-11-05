import { buildPath } from './path';
import { storeToken } from './tokenStorage';

export type CodePurpose = 'register' | 'reset';

// POSTs JSON to the API. Throws an Error carrying the server's message when the
// request fails, so pages can show it with setError(err.message).
export async function postJson<T>(route: string, body: unknown): Promise<T> {
    let response: Response;
    try {
        response = await fetch(buildPath(route), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }
    catch {
        throw new Error("Can't reach the server. Check your connection and try again.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
    }
    return data as T;
}

// Emails a 6-digit code. Registration sends the username too so a taken name is
// caught before the user goes to check their email.
export async function sendCode(email: string, purpose: CodePurpose, username?: string): Promise<void> {
    await postJson('api/sendcode', { email, purpose, username });
}

export async function register(username: string, email: string, password: string, code: string): Promise<void> {
    const { accessToken } = await postJson<{ accessToken: string }>('api/register', { username, email, password, code });
    storeToken(accessToken);
}

export async function login(loginName: string, password: string): Promise<void> {
    const { accessToken } = await postJson<{ accessToken: string }>('api/login', { login: loginName, password });
    storeToken(accessToken);
}

// Returns the reset token the second forgot-password page needs
export async function verifyResetCode(email: string, code: string): Promise<string> {
    const { resetToken } = await postJson<{ resetToken: string }>('api/verifyresetcode', { email, code });
    return resetToken;
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
    await postJson('api/resetpassword', { resetToken, newPassword });
}
