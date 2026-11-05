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
        image: PLACEHOLDER_IMAGE,
        price: 3,
    },
    {
        id: 'coffeeMug',
        name: 'Coffee Mug',
        description: '+30 Chips',
        image: PLACEHOLDER_IMAGE,
        price: 3,
    },
    {
        id: 'pairProgramming',
        name: 'Pair Programming',
        description: '+9 Mult if the hand contains a Pair',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
    {
        id: 'codeReview',
        name: 'Code Review',
        description: '+70 Chips if the hand contains Two Pair',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
    {
        id: 'hotFix',
        name: 'Hot Fix',
        description: '+14 Mult if 3 or fewer cards are played',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
    {
        id: 'redTeam',
        name: 'Red Team',
        description: 'Each scoring ♥ or ♦ card gives +2 Mult',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
    {
        id: 'blueTeam',
        name: 'Blue Team',
        description: 'Each scoring ♠ or ♣ card gives +18 Chips',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
    {
        id: 'faceValidation',
        name: 'Face Validation',
        description: 'Each scoring J, Q or K gives +25 Chips',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
    {
        id: 'offByOne',
        name: 'Off By One',
        description: 'Each scoring Ace or 2 gives +5 Mult',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
    {
        id: 'evenSplit',
        name: 'Even Split',
        description: 'Each scoring even card (2, 4, 6, 8, 10) adds its chips again',
        image: PLACEHOLDER_IMAGE,
        price: 4,
    },
    {
        id: 'mergeConflict',
        name: 'Merge Conflict',
        description: '×2 Mult if the hand is a Flush',
        image: PLACEHOLDER_IMAGE,
        price: 7,
    },
    {
        id: 'stackOverflow',
        name: 'Stack Overflow',
        description: '×2 Mult if the hand is a Straight',
        image: PLACEHOLDER_IMAGE,
        price: 7,
    },
    {
        id: 'recursion',
        name: 'Recursion',
        description: '+1 Mult for every hand played this run',
        image: PLACEHOLDER_IMAGE,
        price: 6,
    },
    {
        id: 'cleanCode',
        name: 'Clean Code',
        description: '+18 Mult if no discards were used this round',
        image: PLACEHOLDER_IMAGE,
        price: 6,
    },
    {
        id: 'legacyCode',
        name: 'Legacy Code',
        description: '+3 Mult for each Joker you own',
        image: PLACEHOLDER_IMAGE,
        price: 6,
    },
    {
        id: 'finalExam',
        name: 'Final Exam',
        description: '×3 Mult on the last hand of a round',
        image: PLACEHOLDER_IMAGE,
        price: 8,
    },
    {
        id: 'ventureCapital',
        name: 'Venture Capital',
        description: 'Earn $3 every time you win a round',
        image: PLACEHOLDER_IMAGE,
        price: 5,
    },
];
