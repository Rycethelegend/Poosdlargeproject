// Example boss:
//   {
//       id: 'myBoss',                               // can't be the same as other ids
//       name: 'My Boss',                            // what is shown in game
//       description: 'Spades score no chips',        // what it does
//       image: '/sprites/bosses/my-boss.png',       // image file which is optional
//   },

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
