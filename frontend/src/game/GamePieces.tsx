import type { ReactNode } from 'react';
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

export function JokerCard({ joker, footer, dim = false }: { joker: JokerDef; footer?: ReactNode; dim?: boolean }) {
    return (
        <div className={`w-36 sm:w-40 bg-cream rounded-2xl p-2 flex flex-col gap-1 shadow-md ${dim ? 'opacity-60' : ''}`}>
            <div className="flex gap-2 items-start">
                <img src={joker.image} alt="" className="w-10 shrink-0 rounded pixelated" />
                <div className="min-w-0">
                    <p className="font-semibold leading-tight break-words">{joker.name}</p>
                    <p className="text-sm leading-snug">{joker.description}</p>
                </div>
            </div>
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
    return (
        <div>
            <p className="text-sm font-semibold mb-1">Jokers {jokers.length}/{max}</p>
            {jokers.length === 0 ? (
                <p className="text-sm opacity-80">No jokers yet. Buy them in the shop after a round.</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {jokers.map((owned) => {
                        const def = JOKERS_BY_ID[owned.id];
                        return def && <JokerCard key={owned.uid} joker={def} footer={renderFooter?.(owned)} />;
                    })}
                </div>
            )}
        </div>
    );
}
