// Example joker:
//   JokerInfo(
//     id: 'myJoker',                                  // can't be the same as other ids
//     name: 'My Joker',                               // what is shown in game
//     description: '+5 Mult if the hand is a Flush',  // what it does
//     image: 'assets/sprites/jokers/my-joker.png',    // image file, add it to assets/sprites/jokers
//     price: 5,                                       // shop price in $
//     rarity: 5,                                      // 1 in 5 rarity (1 = most common, 0 = never in the shop)
//     buffs: ['+5 Mult with a Flush'],                // green labels on the card (optional)
//     debuffs: [],                                    // red labels on the card (optional)
//     cat: true,                                      // counts as a cat for Dog, Mouse and Cat Leader (optional)
//   ),
// Then add what it does in joker_effects.dart. The website has its own copy in
// frontend/src/game/data/jokers.ts; keep both the same.

const String jokerPlaceholderImage = 'assets/sprites/jokers/placeholder.png';

class JokerInfo {
  final String id;
  final String name;
  final String description;
  final String image;
  final int price;
  final int rarity;
  final List<String> buffs;
  final List<String> debuffs;
  final bool cat;

  const JokerInfo({
    required this.id,
    required this.name,
    required this.description,
    this.image = jokerPlaceholderImage,
    required this.price,
    required this.rarity,
    this.buffs = const [],
    this.debuffs = const [],
    this.cat = false,
  });
}

const List<JokerInfo> jokers = [
  JokerInfo(
    id: 'rubberDuck',
    name: 'Rubber Duck',
    description: '+3 Mult',
    image: 'assets/sprites/jokers/duck.png',
    price: 5,
    rarity: 3, // 1 in x rarity
    buffs: ['+3 Mult'],
  ),
  JokerInfo(
    id: 'chuckElephant',
    name: 'Elephant Named Chuck',
    description: '×1.5 Mult. Elephants never forget...',
    image: 'assets/sprites/jokers/elephant.png',
    price: 15,
    rarity: 10, // 1 in x rarity
    buffs: ['×1.5 Mult'],
  ),
  JokerInfo(
    id: 'moneyBags',
    name: 'Money Bags',
    description: 'Adds +\$2 to the end of round total.',
    image: 'assets/sprites/jokers/moneybags.png',
    price: 8,
    rarity: 5, // 1 in x rarity
    buffs: ['+\$2 per round'],
    cat: true,
  ),
  JokerInfo(
    id: 'redTeam',
    name: 'Red Team',
    description: 'Each scoring ♥ Hearts or ♦ Diamonds card gives +2 Mult',
    image: 'assets/sprites/jokers/redteam.png',
    price: 8,
    rarity: 5, // 1 in x rarity
    buffs: ['+2 Mult per ♥/♦'],
    cat: true,
  ),
  JokerInfo(
    id: 'blueTeam',
    name: 'Blue Team',
    description: 'Each scoring ♠ Spades or ♣ Clubs card gives +25 Chips',
    image: 'assets/sprites/jokers/blueteam.png',
    price: 8,
    rarity: 5, // 1 in x rarity
    buffs: ['+25 Chips per ♠/♣'],
    cat: true,
  ),
  JokerInfo(
    id: 'sixSeven',
    name: '67',
    description: '+67 Chips and +6 Mult if the played cards include a 6 and a 7',
    image: 'assets/sprites/jokers/sixseven.png',
    price: 7,
    rarity: 5, // 1 in x rarity
    buffs: ['+67 Chips, +6 Mult with a 6 and 7'],
  ),
  JokerInfo(
    id: 'dog',
    name: 'Dog',
    description: '+2 Mult. +6 Mult instead if you have a cat joker.',
    image: 'assets/sprites/jokers/dog.png',
    price: 6,
    rarity: 4, // 1 in x rarity
    buffs: ['+2 Mult', '+6 Mult with a cat'],
  ),
  JokerInfo(
    id: 'fatrat',
    name: 'Fat Rat',
    description: '+8 Mult, but -4 Mult instead if you have a cat joker.',
    image: 'assets/sprites/jokers/fatrat.png',
    price: 7,
    rarity: 6, // 1 in x rarity
    buffs: ['+8 Mult'],
    debuffs: ['-4 Mult with a cat'],
  ),
  JokerInfo(
    id: 'dice',
    name: 'Dice',
    description:
        'Rolls when you play a hand: -2 Mult, nothing, +3 Mult or +8 Mult (25% each).',
    image: 'assets/sprites/jokers/dice.png',
    price: 5,
    rarity: 4, // 1 in x rarity
    buffs: ['25%: +3 Mult', '25%: +8 Mult'],
    debuffs: ['25%: -2 Mult'],
  ),
  JokerInfo(
    id: 'catLeader',
    name: 'Cat Leader',
    description: '+3 Mult for each other cat joker you have.',
    image: 'assets/sprites/jokers/catleader.png',
    price: 8,
    rarity: 8, // 1 in x rarity
    buffs: ['+3 Mult per other cat'],
    cat: true,
  ),
];
