import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { register, sendCode } from '../authApi';
import CodeStep from './CodeStep';
import FormMessage from './FormMessage';
// import AuthLayout from './AuthLayout';


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


    // Temporarily expose certain functions to F12 console:
    useEffect(() => {
        if (import.meta.env.DEV) {
            (window as any).setStep = setStep;
        }
        return () => { delete (window as any).setStep; };
    }, []);


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
            <div className="relative flex flex-col items-center p-16">

                <p className="title text-center font-playfair mb-10">
                    Poosdalatro
                </p>

                <div className="relative w-full max-w-md bg-felt rounded-4xl border-16 border-felt-edge">

                    <div className="absolute inset-0 rounded-2xl bg-black/5 mask-size-[40px] mask-[url(/patterns/parkay-floor.svg)]" />

                    <CodeStep
                        email={email.trim()}
                        purpose="register"
                        username={username.trim()}
                        submitLabel="Create Account"
                        initialDevCode={devCode}
                        onVerify={handleVerify}
                        onBack={() => setStep('details')}
                    />
                </div>
            </div>

        );
    }

    return (
        <div className="relative flex flex-col items-center p-16">

            <p className="title text-center font-playfair mb-10">
                Poosdalatro
            </p>

            <div className="relative max-w-md w-full bg-felt rounded-4xl border-16 border-felt-edge">

                <div className="absolute inset-0 pointer-events-none rounded-2xl bg-black/5 mask-size-[40px] mask-[url(/patterns/parkay-floor.svg)]" />

                <form className="relative flex flex-col gap-6 p-6" onSubmit={handleDetails}>
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
            </div>
        </div>
    );
}

export default RegisterPage;
