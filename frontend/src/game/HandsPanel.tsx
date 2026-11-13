import { useEffect } from 'react';
import { HAND_TYPES, HANDS, handValues, type HandLevels, type HandType } from './hands';

const HOW_TO_MAKE: Record<HandType, string> = {
    straightFlush: '5 cards in a row, all the same suit',
    fourKind: '4 cards of the same rank',
    fullHouse: '3 of one rank and 2 of another',
    flush: '5 cards of the same suit',
    straight: '5 cards in a row (A-2-3-4-5 counts)',
    threeKind: '3 cards of the same rank',
    twoPair: '2 pairs of different ranks',
    pair: '2 cards of the same rank',
    highCard: 'Anything else: only your highest card scores',
};

// Popup listing every poker hand with its level and chips x mult
const HandsPanel = ({ levels, onClose }: { levels: HandLevels; onClose: () => void }) => {
    const strongestFirst = [...HAND_TYPES].reverse();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="absolute inset-0 z-30 bg-black/50 rounded-2xl flex items-start justify-center p-3 sm:p-6"
            onClick={onClose}>
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Poker hands"
            className="sticky top-4 w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto bg-cream text-ink rounded-2xl p-3 sm:p-4 shadow-xl animate-[popIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xl font-semibold">Poker hands</p>
                <button className="gameButton py-1" onClick={onClose} autoFocus>Close</button>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 sm:gap-x-4 text-sm font-semibold opacity-70 px-2 pb-1 border-b-2 border-felt-edge/40">
                <span>Hand</span>
                <span className="text-right">Level</span>
                <span className="text-right">Chips × Mult</span>
            </div>

            <ul>
                {strongestFirst.map((type) => {
                    const level = levels[type] ?? 1;
                    const { chips, mult } = handValues(type, level);
                    return (
                        <li key={type} className="grid grid-cols-[1fr_auto_auto] gap-x-3 sm:gap-x-4 items-center px-2 py-1.5 odd:bg-black/5 rounded-lg">
                            <span>
                                <span className="font-semibold">{HANDS[type].name}</span>
                                <span className="block text-sm opacity-80">{HOW_TO_MAKE[type]}</span>
                            </span>
                            <span className={`text-right tabular-nums ${level > 1 ? 'font-semibold' : ''}`}>
                                {level}{level > 1 && ' ↑'}
                            </span>
                            <span className="text-right tabular-nums whitespace-nowrap">
                                <span className="bg-chips text-white rounded-lg px-2 py-0.5">{chips}</span>
                                {' × '}
                                <span className="bg-mult text-white rounded-lg px-2 py-0.5">{mult}</span>
                            </span>
                        </li>
                    );
                })}
            </ul>

            <p className="text-sm mt-2 opacity-80">
                Each scoring card also adds its own chips: 2-10 their number, J/Q/K 10, A 11. Buy Study Guides in the shop to level a hand up.
            </p>
        </div>
        </div>
    );
}

export default HandsPanel;
