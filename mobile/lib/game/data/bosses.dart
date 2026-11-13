// Example boss:
//   BossInfo(
//     id: 'myBoss',                                // can't be the same as other ids
//     name: 'My Boss',                             // what is shown in game
//     description: 'Spades score no chips',        // what it does
//     image: 'assets/sprites/bosses/my-boss.png',  // image file, add it to assets/sprites/bosses
//   ),
// Then add its rules in boss_effects.dart

const String bossPlaceholderImage = 'assets/sprites/bosses/placeholder.png';

class BossInfo {
  final String id;
  final String name;
  final String description;
  final String image;

  const BossInfo({
    required this.id,
    required this.name,
    required this.description,
    this.image = bossPlaceholderImage,
  });
}

const List<BossInfo> bosses = [
  BossInfo(
    id: 'shortStack',
    name: 'Short Stack',
    description: 'Only 3 hands this round',
  ),
  BossInfo(
    id: 'nodiscards',
    name: 'No Discards',
    description: 'No discards this round',
  ),
  BossInfo(
    id: 'heartbreak',
    name: 'Heartbreak',
    description: '♥ Hearts score no chips',
  ),
  BossInfo(
    id: 'clubClosed',
    name: 'Club Closed',
    description: '♣ Clubs score no chips',
  ),
  BossInfo(
    id: 'downWithRoyals',
    name: 'Down with Royals',
    description: 'J, Q and K score no chips',
  ),
];
