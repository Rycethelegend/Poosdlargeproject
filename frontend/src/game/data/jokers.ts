// ============================================================================
// JOKER LIST
//
// Every Joker in the game. To add one, copy the template below into the list
// and fill it in:
//
//   {
//       id: 'myJoker',                                  // unique, no spaces
//       name: 'My Joker',                               // shown on the card
//       description: '+5 Mult if the hand is a Flush',  // what it does
//       image: '/sprites/jokers/my-joker.png',          // file in frontend/public/sprites/jokers/
//       price: 5,                                       // shop price in $
//   },
//
// Images: put a PNG in frontend/public/sprites/jokers/ (48×64 like the cards
// looks best) and use its path here. Until there's art, use
// PLACEHOLDER_IMAGE.
//
// A new Joker shows up in the shop once its effect is written in
// ../jokerEffects.ts under the same id. Until then it's listed but not sold,
// and the browser console says which Jokers are still missing effects.
// ============================================================================

export const PLACEHOLDER_IMAGE = '/sprites/jokers/placeholder.png';

export interface JokerInfo {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
}

export const JOKERS: JokerInfo[] = [
    {
        id: 'rubberDuck',
        name: 'Rubber Duck',
        description: '+4 Mult',
        image: duck,
        price: 3,
    },
    {
        id: 'chuckElephant',
        name: 'Elephant Named Chuck',
        description: 'Always adds +10 chips and +2 Mult to the hand. Elephants never forget...',
        image: elephant,
        price: 10,
    },
    {
        id: 'moneyBags',
        name: 'Money Bags',
        description: 'Adds +$1 to the end of round total.',
        image: moneybags,
        price: 5,
    },
    {
        id: 'redTeam',
        name: 'Red Team',
        description: 'Each scoring ♥ Hearts or ♦ Diamonds card gives +2 Mult',
        image: redteam,
        price: 5,
    },
    {
        id: 'blueTeam',
        name: 'Blue Team',
        description: 'Each scoring ♠ Spades or ♣ Clubs card gives +18 Chips',
        image: blueteam,
        price: 5,
    },
];
