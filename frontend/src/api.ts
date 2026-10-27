const TOKEN_KEY = 'token';
const USERNAME_KEY = 'username';

export interface AuthResponse {
  token: string;
  username: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
}

// POSTs JSON to the backend and throws the server's error message on failure
async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong, please try again');
  }
  return data as T;
}

function saveSession({ token, username }: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export async function login(username: string, password: string) {
  saveSession(await postJson<AuthResponse>('/login', { username, password }));
}

export async function register(input: RegisterInput) {
  saveSession(await postJson<AuthResponse>('/register', input));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(TOKEN_KEY) !== null;
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) ?? '';
}
