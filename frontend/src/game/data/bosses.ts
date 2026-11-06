// ============================================================================
// BOSS LIST
//
// Each Table's third round (the High Roller) uses one of these Bosses, picked
// at random. To add one, copy the template below into the list and fill it in:
//
//   {
//       id: 'myBoss',                               // unique, no spaces
//       name: 'My Boss',                            // shown in the game
//       description: 'Spades score no chips',        // what it does
//       image: '/sprites/bosses/my-boss.png',       // optional; file in frontend/public/sprites/bosses/
//   },
//
// Leave image out (or use PLACEHOLDER_IMAGE) when there's no art yet.
//
// A new Boss is only picked once its rules are written in ../bossEffects.ts
// under the same id. Until then it's listed but skipped, and the browser
// console says which Bosses are still missing rules.
// ============================================================================

export const PLACEHOLDER_IMAGE = '/sprites/bosses/placeholder.png';

export interface BossInfo {
    id: string;
    name: string;
    description: string;
    image?: string;
}

export const BOSSES: BossInfo[] = [
    {
        id: 'shortStack',
        name: 'Short Stack',
        description: 'Only 3 hands this round',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'nodiscards',
        name: 'No Discards',
        description: 'No discards this round',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'heartbreak',
        name: 'Heartbreak',
        description: '♥ Hearts score no chips',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'clubClosed',
        name: 'Club Closed',
        description: '♣ Clubs score no chips',
        image: PLACEHOLDER_IMAGE,
    },
    {
        id: 'downWithRoyals',
        name: 'Down with Royals',
        description: 'J, Q and K score no chips',
        image: PLACEHOLDER_IMAGE,
    },
];
