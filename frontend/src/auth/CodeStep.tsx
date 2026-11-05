import { useEffect, useState, type FormEvent } from 'react';
import { sendCode, type CodePurpose } from '../authApi';
import FormMessage from './FormMessage';

const RESEND_COOLDOWN_SECONDS = 60;

type Props = {
    email: string;
    purpose: CodePurpose;
    username?: string;
    submitLabel: string;
    // Called with the typed code. Throw an Error to show its message here.
    onVerify: (code: string) => Promise<void>;
    onBack: () => void;
};

// "Enter the code we emailed you" step, shared by registration and password reset.
// Assumes the first code has already been sent when it appears.
const CodeStep = ({ email, purpose, username, submitLabel, onVerify, onBack }: Props) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState(`We sent a 6-digit code to ${email}. It expires in 10 minutes.`);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    async function handleVerify(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (!/^\d{6}$/.test(code)) {
            setError('Enter the 6-digit code from the email');
            return;
        }

        setLoading(true);
        try {
            await onVerify(code);
        }
        catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    }

    async function handleResend() {
        setError('');
        setInfo('');
        try {
            await sendCode(email, purpose, username);
            setCode('');
            setInfo(`A new code is on its way to ${email}.`);
            setCooldown(RESEND_COOLDOWN_SECONDS);
        }
        catch (err) {
            setError((err as Error).message);
        }
    }

    return (
        <form className="flex flex-col gap-4" onSubmit={handleVerify}>
            <FormMessage error={error} info={info} />

            <input
                className="feltInput text-center tracking-[0.5em]"
                aria-label="Verification code"
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
            />

            <button type="submit" className="feltButton" disabled={loading}>
                {loading ? '...' : submitLabel}
            </button>

            <div className="flex justify-between gap-2">
                <button type="button" className="feltLink" onClick={onBack}>
                    Back
                </button>
                <button type="button" className="feltLink" onClick={handleResend} disabled={cooldown > 0}>
                    {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                </button>
            </div>
        </form>
    );
}

export default CodeStep;
