export type Suit = 'hearts' | 'diamonds' | 'spades' | 'clubs';

// Same order as the rows of /poker-cards.png
export const SUITS: Suit[] = ['hearts', 'diamonds', 'spades', 'clubs'];

export const SUIT_SYMBOL: Record<Suit, string> = {
    hearts: '♥', diamonds: '♦', spades: '♠', clubs: '♣',
};

// rank: 2-10, 11 = Jack, 12 = Queen, 13 = King, 14 = Ace
export interface Card {
    id: string;
    suit: Suit;
    rank: number;
}

export type SortMode = 'rank' | 'suit';

const RANK_NAMES: Record<number, string> = { 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
const RANK_SHORT: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

export function rankShort(rank: number): string {
    return RANK_SHORT[rank] ?? String(rank);
}

export function cardName(card: Card): string {
    const suit = card.suit[0].toUpperCase() + card.suit.slice(1);
    return `${RANK_NAMES[card.rank] ?? card.rank} of ${suit}`;
}

export function cardLabel(card: Card): string {
    return rankShort(card.rank) + SUIT_SYMBOL[card.suit];
}

// Chips a card adds when it scores: number cards = their number, faces = 10, Ace = 11
export function cardChips(card: Card): number {
    if (card.rank === 14) return 11;
    if (card.rank >= 11) return 10;
    return card.rank;
}

export function isFace(card: Card): boolean {
    return card.rank >= 11 && card.rank <= 13;
}

export function isRed(card: Card): boolean {
    return card.suit === 'hearts' || card.suit === 'diamonds';
}

export function createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (let rank = 2; rank <= 14; rank++) {
            deck.push({ id: `${suit}-${rank}`, suit, rank });
        }
    }
    return deck;
}

export function shuffle<T>(items: T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

export function sortCards(cards: Card[], mode: SortMode): Card[] {
    const suitOrder = (c: Card) => SUITS.indexOf(c.suit);
    return [...cards].sort((a, b) => mode === 'rank'
        ? b.rank - a.rank || suitOrder(a) - suitOrder(b)
        : suitOrder(a) - suitOrder(b) || b.rank - a.rank);
}
