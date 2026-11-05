// ============================================================================
// BLIND LIST
//
// Each Table's third round (the High Roller) uses one of these Blinds, picked
// at random. To add one, copy the template below into the list and fill it in:
//
//   {
//       id: 'myBlind',                               // unique, no spaces
//       name: 'My Blind',                            // shown in the game
//       description: 'Spades score no chips',        // what it does
//       image: '/sprites/blinds/my-blind.png',       // optional; file in frontend/public/sprites/blinds/
//   },
//
// Leave image out (or use PLACEHOLDER_IMAGE) when there's no art yet.
//
// A new Blind is only picked once its rules are written in ../blindEffects.ts
// under the same id. Until then it's listed but skipped, and the browser
// console says which Blinds are still missing rules.
// ============================================================================

export const PLACEHOLDER_IMAGE = '/sprites/blinds/placeholder.png';

export interface BlindInfo {
    id: string;
    name: string;
    description: string;
    image?: string;
}

export const BLINDS: BlindInfo[] = [
    {
        id: 'shortStack',
        name: 'Short Stack',
        description: 'Only 3 hands this round',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'noRedraws',
        name: 'No Redraws',
        description: 'No discards this round',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'heartbreak',
        name: 'Heartbreak',
        description: '♥ cards score no chips',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'clubClosed',
        name: 'Club Closed',
        description: '♣ cards score no chips',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'smallTalk',
        name: 'Small Talk',
        description: 'Play at most 4 cards per hand',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'royalSnub',
        name: 'Royal Snub',
        description: 'J, Q and K score no chips',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'tightGrip',
        name: 'Tight Grip',
        description: 'Hand size is 2 smaller',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'payToPlay',
        name: 'Pay to Play',
        description: 'Every hand played costs $1',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'halftime',
        name: 'Halftime',
        description: "Poker hands' base chips and mult are halved",
        image: PLACEHOLDER_IMAGE,
    },
];
