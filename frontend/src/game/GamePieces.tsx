import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { JOKERS_BY_ID, type JokerDef } from './jokers';
import { formatMult } from './format';
import type { OwnedJoker } from './run';
import { BOSSES_BY_ID } from './rounds';
import { ChipStack, type ChipColor } from './sprites';

export function Stat({ label, children, chip, className = '' }: { label: string; children: ReactNode; chip?: ChipColor; className?: string }) {
    return (
        <div className={`bg-cream/85 rounded-2xl px-2 sm:px-3 py-1.5 flex items-center gap-2 min-w-0 ${className}`}>
            {chip && <ChipStack color={chip} height={1} className="hidden sm:block w-5 shrink-0" />}
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide opacity-70 leading-tight truncate">{label}</p>
                <p className="text-lg sm:text-xl font-semibold tabular-nums leading-tight truncate">{children}</p>
            </div>
        </div>
    );
}

// The blue chips × red mult display
export function ChipsTimesMult({ chips, mult, big = false }: { chips: number; mult: number; big?: boolean }) {
    const size = big ? 'text-2xl sm:text-3xl px-4 py-1' : 'text-lg px-3 py-0.5';
    return (
        <div className="flex items-center gap-2 font-semibold tabular-nums">
            <span className={`bg-chips text-white rounded-xl ${size}`}>{chips.toLocaleString()}</span>
            <span className="text-xl">×</span>
            <span className={`bg-mult text-white rounded-xl ${size}`}>{formatMult(mult)}</span>
        </div>
    );
}

// Green buffs, red debuffs, and a Cat tag for the cat jokers
function JokerLabels({ joker, large = false }: { joker: JokerDef; large?: boolean }) {
    const size = large ? 'text-base px-2.5 py-1' : 'text-xs px-1.5 py-0.5';
    const buffs = joker.buffs ?? [];
    const debuffs = joker.debuffs ?? [];
    if (!buffs.length && !debuffs.length && !joker.cat) return null;
    return (
        <ul className="flex flex-wrap gap-1" aria-label="Effects">
            {buffs.map((text) => (
                <li key={text} className={`${size} leading-tight rounded-md bg-felt-edge text-[#f2e8cf]`}>▲ {text}</li>
            ))}
            {debuffs.map((text) => (
                <li key={text} className={`${size} leading-tight rounded-md bg-danger text-[#f2e8cf]`}>▼ {text}</li>
            ))}
            {joker.cat && (
                <li className={`${size} leading-tight rounded-md bg-wood-light text-ink`}>Cat</li>
            )}
        </ul>
    );
}

// large is the big version used in the popup
export function JokerCard({ joker, footer, dim = false, large = false }: { joker: JokerDef; footer?: ReactNode; dim?: boolean; large?: boolean }) {
    return (
        <div className={`${large ? 'w-[min(30rem,calc(100vw-2rem))] p-5 gap-3 rounded-3xl' : 'w-36 sm:w-40 p-2 gap-1 rounded-2xl'} bg-cream text-ink flex flex-col shadow-md ${dim ? 'opacity-60' : ''}`}>
            <div className={`flex ${large ? 'gap-4 items-center' : 'gap-2 items-start'}`}>
                <img src={joker.image} alt="" className={`${large ? 'w-28' : 'w-10'} shrink-0 rounded pixelated`} />
                <div className="min-w-0">
                    <p className={`font-semibold leading-tight break-words ${large ? 'text-2xl' : ''}`}>{joker.name}</p>
                    <p className={large ? 'text-lg leading-snug mt-1' : 'text-sm leading-snug'}>{joker.description}</p>
                </div>
            </div>
            <JokerLabels joker={joker} large={large} />
            {footer}
        </div>
    );
}

// A Boss's name and description, with its picture when it has one
export function BossLabel({ bossId, prefix }: { bossId: string; prefix: string }) {
    const boss = BOSSES_BY_ID[bossId];
    if (!boss) return null;
    return (
        <span className="inline-flex items-center gap-2 align-middle">
            {boss.image && <img src={boss.image} alt="" className="w-6 pixelated" />}
            <span>{prefix} <span className="font-semibold">{boss.name}</span>: {boss.description}</span>
        </span>
    );
}

export function JokerRow({ jokers, max, renderFooter }: {
    jokers: OwnedJoker[];
    max: number;
    renderFooter?: (owned: OwnedJoker) => ReactNode;
}) {
    const [open, setOpen] = useState<{ joker: JokerDef; from: DOMRect } | null>(null);
    return (
        <div>
            {open && <JokerPopup joker={open.joker} from={open.from} onClose={() => setOpen(null)} />}
            <p className="text-sm font-semibold mb-1">Jokers {jokers.length}/{max}</p>
            {jokers.length === 0 ? (
                <p className="text-sm opacity-80">No jokers yet. Buy them in the shop after a round.</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {jokers.map((owned) => {
                        const def = JOKERS_BY_ID[owned.id];
                        if (!def) return null;
                        // in a round (no buttons on the cards) a card opens the big popup
                        if (renderFooter) return <JokerCard key={owned.uid} joker={def} footer={renderFooter(owned)} />;
                        return (
                            <button
                                key={owned.uid}
                                aria-haspopup="dialog"
                                aria-label={`${def.name}: show details`}
                                className="text-left rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-wood"
                                onClick={(e) => setOpen({ joker: def, from: e.currentTarget.getBoundingClientRect() })}>
                                <JokerCard joker={def} />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// A big version of a joker card, grown out of the card that was clicked.
// Closes with the button, a click outside it, or Escape.
function JokerPopup({ joker, from, onClose }: { joker: JokerDef; from: DOMRect; onClose: () => void }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const closing = useRef(false);

    // the transform that puts the big card where the small one was
    function fromSmall(): string {
        const to = cardRef.current!.getBoundingClientRect();
        const dx = from.left + from.width / 2 - (to.left + to.width / 2);
        const dy = from.top + from.height / 2 - (to.top + to.height / 2);
        return `translate(${dx}px, ${dy}px) scale(${from.width / to.width})`;
    }

    useLayoutEffect(() => {
        cardRef.current?.animate(
            [{ transform: fromSmall(), opacity: 0.6 }, { transform: 'none', opacity: 1 }],
            { duration: 300, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function close() {
        if (closing.current) return;
        closing.current = true;
        const anim = cardRef.current?.animate(
            [{ transform: 'none', opacity: 1 }, { transform: fromSmall(), opacity: 0 }],
            { duration: 220, easing: 'ease-in', fill: 'forwards' });
        if (anim) anim.onfinish = onClose;
        else onClose();
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center gap-4 p-4"
            onClick={close}>
            <div
                ref={cardRef}
                role="dialog"
                aria-modal="true"
                aria-label={joker.name}
                className="rounded-3xl ring-4 ring-felt-edge"
                onClick={(e) => e.stopPropagation()}>
                <JokerCard joker={joker} large />
            </div>
            <button className="gameButton" onClick={(e) => { e.stopPropagation(); close(); }} autoFocus>
                Close
            </button>
        </div>
    );
}
