// Example joker:
//   {
//       id: 'myJoker',                                  // can't be the same as other ids
//       name: 'My Joker',                               // what is shown in game
//       description: '+5 Mult if the hand is a Flush',  // what it does
//       image: '/sprites/jokers/my-joker.png',          // image file which is optional
//       price: 5,                                       // shop price in $
//       rarity: 5,                                      // 1 in 5 rarity (1 = most common, 0 = never in the shop)
//   },

export const PLACEHOLDER_IMAGE = '/sprites/jokers/placeholder.png';

export interface JokerInfo {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    rarity: number;
}

export const JOKERS: JokerInfo[] = [
    {
        id: 'rubberDuck',
        name: 'Rubber Duck',
        description: '+4 Mult',
        image: '/sprites/jokers/duck.png',
        price: 5,
        rarity: 3,   // 1 in x rarity
    },
    {
        id: 'chuckElephant',
        name: 'Elephant Named Chuck',
        description: 'Always adds +10 chips and +2 Mult to the hand. Elephants never forget...',
        image: '/sprites/jokers/elephant.png',
        price: 15,
        rarity: 10,  // 1 in x rarity
    },
    {
        id: 'moneyBags',
        name: 'Money Bags',
        description: 'Adds +$1 to the end of round total.',
        image: '/sprites/jokers/moneybags.png',
        price: 8,
        rarity: 5,   // 1 in x rarity
    },
    {
        id: 'redTeam',
        name: 'Red Team',
        description: 'Each scoring ♥ Hearts or ♦ Diamonds card gives +2 Mult',
        image: '/sprites/jokers/redteam.png',
        price: 8,
        rarity: 5,   // 1 in x rarity
    },
    {
        id: 'blueTeam',
        name: 'Blue Team',
        description: 'Each scoring ♠ Spades or ♣ Clubs card gives +18 Chips',
        image: '/sprites/jokers/blueteam.png',
        price: 8,
        rarity: 5,   // 1 in x rarity
    },
];
