import { useState, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { login } from '../authApi';
import FormMessage from './FormMessage';


const LoginPage = () => {

    const navigate = useNavigate();
    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // The reset password page sends a success message here
    const notice = (useLocation().state as { message?: string } | null)?.message ?? '';


    async function handleSubmit(e: SyntheticEvent) {
        e.preventDefault();
        setError('');

        if (!loginName.trim() || !password) 
        {
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

        <div className="relative w-full flex flex-col items-center p-16 gap-16">

            <p className="title text-center font-playfair">
                Poosdalatro
            </p>

            <div className="relative w-full max-w-md bg-felt rounded-4xl border-16 border-felt-edge">

                <div className="absolute inset-0 rounded-2xl bg-black/5 mask-size-[40px] mask-[url(/patterns/parkay-floor.svg)]" />

                <form className="relative flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
                    
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
            </div>
        </div>
    );
}

export default LoginPage;
