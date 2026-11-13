import 'dart:math';
import 'package:poosdalatro/game/data/jokers.dart';
import 'package:poosdalatro/game/joker_effects.dart';

// Jokers are bought in the shop and change how hands score. Up to maxJokers
// at once; they trigger left to right.
const int maxJokers = 5;

final Map<String, JokerInfo> jokersById = {for (final j in jokers) j.id: j};

// Only Jokers with an effect and a rarity above 0 show up in the shop
final List<String> shopJokerIds = jokers
    .where((j) => jokerEffects.containsKey(j.id) && j.rarity > 0)
    .map((j) => j.id)
    .toList();

// rarity x = a 1 in x chance, so its weight is 1 / x
double _weight(String id) {
  final rarity = jokersById[id]?.rarity ?? 0;
  return rarity > 0 ? 1 / rarity : 0;
}

final _random = Random();

/// Weighted pick without repeats; empty slots are null
List<String?> pickWeightedJokers(List<String> ids, int count) {
  final pool = ids.where((id) => _weight(id) > 0).toList();
  final picked = <String?>[];
  while (picked.length < count && pool.isNotEmpty) {
    final total = pool.fold<double>(0, (sum, id) => sum + _weight(id));
    var roll = _random.nextDouble() * total;
    var index = 0;
    while (index < pool.length - 1 && roll >= _weight(pool[index])) {
      roll -= _weight(pool[index]);
      index++;
    }
    picked.add(pool.removeAt(index));
  }
  while (picked.length < count) {
    picked.add(null);
  }
  return picked;
}

int sellPrice(JokerInfo joker) => max(1, joker.price ~/ 2);
