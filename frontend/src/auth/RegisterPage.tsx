import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { register, sendCode } from '../authApi';
import AuthLayout from './AuthLayout';
import CodeStep from './CodeStep';
import FormMessage from './FormMessage';

// Step 1 collects the account details and emails a code.
// Step 2 checks the code; only then is the account created and the user logged in.
const RegisterPage = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState<'details' | 'code'>('details');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [devCode, setDevCode] = useState<string | undefined>();

    async function handleDetails(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (!username.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Please fill in every field');
            return;
        }
        if (!/^[A-Za-z0-9_]{3,20}$/.test(username.trim())) {
            setError('Username must be 3-20 letters, numbers or underscores');
            return;
        }
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
            setDevCode(await sendCode(email.trim(), 'register', username.trim()));
            setStep('code');
        }
        catch (err) {
            setError((err as Error).message);
        }
        finally {
            setLoading(false);
        }
    }

    async function handleVerify(code: string) {
        await register(username.trim(), email.trim(), password, code);
        navigate('/', { replace: true });
    }

    if (step === 'code') {
        return (
            <AuthLayout heading="Verify Your Email">
                <CodeStep
                    email={email.trim()}
                    purpose="register"
                    username={username.trim()}
                    submitLabel="Create Account"
                    initialDevCode={devCode}
                    onVerify={handleVerify}
                    onBack={() => setStep('details')}
                />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout heading="Register">
            <form className="flex flex-col gap-4" onSubmit={handleDetails}>
                <FormMessage error={error} />

                <input
                    className="feltInput"
                    aria-label="Username"
                    placeholder="Username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="feltInput"
                    type="email"
                    aria-label="Email"
                    placeholder="Email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="feltInput"
                    type="password"
                    aria-label="Password"
                    placeholder="Password (8+ characters)"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <input
                    className="feltInput"
                    type="password"
                    aria-label="Confirm password"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button type="submit" className="feltButton" disabled={loading}>
                    {loading ? '...' : 'Send Verification Code'}
                </button>

                <p className="text-center text-lg">
                    Have an account? <Link to="/login" className="feltLink">Log in</Link>
                </p>
            </form>
        </AuthLayout>
    );
}

export default RegisterPage;
