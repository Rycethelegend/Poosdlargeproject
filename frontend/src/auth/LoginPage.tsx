import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { login } from '../authApi';
import AuthLayout from './AuthLayout';
import FormMessage from './FormMessage';

const LoginPage = () => {
    const navigate = useNavigate();
    // The reset password page sends a success message here
    const notice = (useLocation().state as { message?: string } | null)?.message ?? '';

    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (!loginName.trim() || !password) {
            setError('Please enter your username or email and your password');
            return;
        }

        setLoading(true);
        try {
            await login(loginName, password);
            navigate('/', { replace: true });
        }
        catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }

    return (
        <AuthLayout heading="Log In">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <FormMessage error={error} info={notice} />

                <input
                    className="feltInput"
                    aria-label="Username or email"
                    placeholder="Username or email"
                    autoComplete="username"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                />
                <input
                    className="feltInput"
                    type="password"
                    aria-label="Password"
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Link to="/forgot-password" className="feltLink self-end">
                    Forgot password?
                </Link>

                <button type="submit" className="feltButton" disabled={loading}>
                    {loading ? '...' : 'Log In'}
                </button>

                <p className="text-center text-lg">
                    New here? <Link to="/register" className="feltLink">Create an account</Link>
                </p>
            </form>
        </AuthLayout>
    );
}

export default LoginPage;
