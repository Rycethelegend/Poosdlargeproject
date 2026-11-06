import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { resetPassword } from '../authApi';
import AuthLayout from './AuthLayout';
import FormMessage from './FormMessage';

// Second forgot-password page: new password + confirm, then back to log in.
const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const resetToken = (useLocation().state as { resetToken?: string } | null)?.resetToken;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Only reachable from the forgot password page after a correct code
    if (!resetToken) {
        return <Navigate to="/forgot-password" replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(resetToken!, password);
            navigate('/login', {
                replace: true,
                state: { message: 'Your password has been reset. Log in with your new password.' },
            });
        }
        catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }

    return (
        <AuthLayout heading="Set New Password">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <FormMessage error={error} />

                <input
                    className="feltInput"
                    type="password"
                    aria-label="New password"
                    placeholder="New password (8+ characters)"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                />
                <input
                    className="feltInput"
                    type="password"
                    aria-label="Confirm new password"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button type="submit" className="feltButton" disabled={loading}>
                    {loading ? '...' : 'Set Password'}
                </button>

                <Link to="/login" className="feltLink text-center">
                    Back to log in
                </Link>
            </form>
        </AuthLayout>
    );
}

export default ResetPasswordPage;
