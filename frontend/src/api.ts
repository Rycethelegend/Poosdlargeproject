const TOKEN_KEY = 'token_data';
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

function saveSession(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
}

export async function login(loginName: string, password: string) {
  const { accessToken } = await postJson<{ accessToken: string }>('/login', { login: loginName, password });
  saveSession(accessToken, loginName);
}

export async function register(input: RegisterInput) {
  const response = await postJson<AuthResponse>('/register', input);
  saveSession(response.token, response.username);
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
