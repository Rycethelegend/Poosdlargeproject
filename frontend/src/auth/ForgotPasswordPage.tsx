import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { sendCode, verifyResetCode } from '../authApi';
import AuthLayout from './AuthLayout';
import CodeStep from './CodeStep';
import FormMessage from './FormMessage';

// First forgot-password page: email -> code. A correct code moves on to
// /reset-password, carrying the reset token the server handed back.
const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState<'email' | 'code'>('email');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleEmail(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            await sendCode(email.trim(), 'reset');
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
        const resetToken = await verifyResetCode(email.trim(), code);
        navigate('/reset-password', { replace: true, state: { resetToken } });
    }

    if (step === 'code') {
        return (
            <AuthLayout heading="Check Your Email">
                <CodeStep
                    email={email.trim()}
                    purpose="reset"
                    submitLabel="Continue"
                    onVerify={handleVerify}
                    onBack={() => setStep('email')}
                />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout heading="Forgot Password">
            <form className="flex flex-col gap-4" onSubmit={handleEmail}>
                <p className="text-lg text-center">
                    Enter the email on your account and we'll send you a code to reset your password.
                </p>

                <FormMessage error={error} />

                <input
                    className="feltInput"
                    type="email"
                    aria-label="Email"
                    placeholder="Email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <button type="submit" className="feltButton" disabled={loading}>
                    {loading ? '...' : 'Send Code'}
                </button>

                <Link to="/login" className="feltLink text-center">
                    Back to log in
                </Link>
            </form>
        </AuthLayout>
    );
}

export default ForgotPasswordPage;
