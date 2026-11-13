// Example joker:
//   JokerInfo(
//     id: 'myJoker',                                  // can't be the same as other ids
//     name: 'My Joker',                               // what is shown in game
//     description: '+5 Mult if the hand is a Flush',  // what it does
//     image: 'assets/sprites/jokers/my-joker.png',    // image file, add it to assets/sprites/jokers
//     price: 5,                                       // shop price in $
//     rarity: 5,                                      // 1 in 5 rarity (1 = most common, 0 = never in the shop)
//   ),
// Then add what it does in joker_effects.dart

const String jokerPlaceholderImage = 'assets/sprites/jokers/placeholder.png';

class JokerInfo {
  final String id;
  final String name;
  final String description;
  final String image;
  final int price;
  final int rarity;

  const JokerInfo({
    required this.id,
    required this.name,
    required this.description,
    this.image = jokerPlaceholderImage,
    required this.price,
    required this.rarity,
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
  ),
  JokerInfo(
    id: 'chuckElephant',
    name: 'Elephant Named Chuck',
    description: '×1.5 Mult. Elephants never forget...',
    image: 'assets/sprites/jokers/elephant.png',
    price: 15,
    rarity: 10, // 1 in x rarity
  ),
  JokerInfo(
    id: 'moneyBags',
    name: 'Money Bags',
    description: 'Adds +\$2 to the end of round total.',
    image: 'assets/sprites/jokers/moneybags.png',
    price: 8,
    rarity: 5, // 1 in x rarity
  ),
  JokerInfo(
    id: 'redTeam',
    name: 'Red Team',
    description: 'Each scoring ♥ Hearts or ♦ Diamonds card gives +2 Mult',
    image: 'assets/sprites/jokers/redteam.png',
    price: 8,
    rarity: 5, // 1 in x rarity
  ),
  JokerInfo(
    id: 'blueTeam',
    name: 'Blue Team',
    description: 'Each scoring ♠ Spades or ♣ Clubs card gives +25 Chips',
    image: 'assets/sprites/jokers/blueteam.png',
    price: 8,
    rarity: 5, // 1 in x rarity
  ),
];
