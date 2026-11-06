import type { CSSProperties } from 'react';
import { cardName, SUITS, type Card } from './cards';

// Crops one sprite out of a sprite sheet. Uses percentages so the sprite scales
// to whatever size the element is given in CSS.
function spriteStyle(url: string, sheetW: number, sheetH: number, x: number, y: number, w: number, h: number): CSSProperties {
    return {
        backgroundImage: `url('${url}')`,
        backgroundSize: `${(sheetW / w) * 100}% ${(sheetH / h) * 100}%`,
        backgroundPosition: `${(x / (sheetW - w)) * 100}% ${(y / (sheetH - h)) * 100}%`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
    };
}

// /poker-cards.png: 48×64 cards. Rows are hearts, diamonds, spades, clubs, then
// card backs. Columns go A, 2 ... 10, J, Q, K, then two jokers on the hearts row.
const CARD_SHEET = { url: '/poker-cards.png', w: 944, h: 385, cardW: 48, cardH: 64 };

function cardSprite(col: number, row: number): CSSProperties {
    const s = CARD_SHEET;
    return spriteStyle(s.url, s.w, s.h, col * s.cardW, row * s.cardH, s.cardW, s.cardH);
}

export function CardFace({ card, className = '', style }: { card: Card; className?: string; style?: CSSProperties }) {
    const col = card.rank === 14 ? 0 : card.rank - 1;
    return (
        <div
            role="img"
            aria-label={cardName(card)}
            className={`aspect-[3/4] ${className}`}
            style={{ ...cardSprite(col, SUITS.indexOf(card.suit)), ...style }}
        />
    );
}

// /sprites/poker-chips.png: 32×48 chip stacks on a 48px grid. Left half rows are
// red, white, green, black; right half rows are blue, purple, pink, orange.
// Columns within each half go from 1 chip to the tallest stack.
export type ChipColor = 'red' | 'white' | 'green' | 'black' | 'blue' | 'purple' | 'pink' | 'orange';
const CHIP_ROWS: ChipColor[][] = [['red', 'white', 'green', 'black'], ['blue', 'purple', 'pink', 'orange']];

export function ChipStack({ color, height = 0, className = '' }: { color: ChipColor; height?: 0 | 1 | 2 | 3; className?: string }) {
    const half = CHIP_ROWS[0].includes(color) ? 0 : 1;
    const row = CHIP_ROWS[half].indexOf(color);
    const col = half * 4 + height;
    return (
        <div
            aria-hidden
            className={`aspect-[2/3] ${className}`}
            style={spriteStyle('/sprites/poker-chips.png', 368, 192, col * 48, row * 48, 32, 48)}
        />
    );
}

// /sprites/card-decks.png: boxed decks. This is the red one in the top-left.
export function DeckBox({ className = '' }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={`aspect-[51/73] ${className}`}
            style={spriteStyle('/sprites/card-decks.png', 480, 480, 48, 71, 51, 73)}
        />
    );
}
