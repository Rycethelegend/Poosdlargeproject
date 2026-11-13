import { useEffect } from 'react';
import { ASSETS, TEAM } from '../credits';

const CreditsPanel = ({ onClose }: { onClose: () => void }) => {

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Credits"
                className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-cream text-ink rounded-2xl p-4 sm:p-6 shadow-xl animate-[popIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center justify-between gap-2 mb-4">
                    <p className="text-2xl font-semibold">Credits</p>
                    <button className="gameButton py-1" onClick={onClose} autoFocus>Close</button>
                </div>

                <section className="mb-5">
                    <p className="text-lg font-semibold border-b-2 border-felt-edge/40 pb-1 mb-2">Team</p>
                    <ul className="space-y-1">
                        {TEAM.map((member) => (
                            <li key={member.name} className="flex flex-wrap justify-between gap-x-4">
                                <span className="font-semibold">{member.name}</span>
                                <span className="opacity-80">{member.role}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="mb-5">
                    <p className="text-lg font-semibold border-b-2 border-felt-edge/40 pb-1 mb-2">Art and fonts</p>
                    <ul className="space-y-3">
                        {ASSETS.map((asset) => (
                            <li key={asset.what}>
                                <p className="font-semibold">{asset.what}</p>
                                <p className="text-sm">
                                    {asset.creator}
                                    {asset.license && <span className="opacity-80"> · {asset.license}</span>}
                                </p>
                                {asset.source && (
                                    <a href={asset.source} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4 break-all">
                                        {asset.source}
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>

                <p className="text-sm opacity-80">Poosdalatro was made for COP 4331C at the University of Central Florida, Fall 2026.</p>
            </div>
        </div>
    );
}

export default CreditsPanel;
