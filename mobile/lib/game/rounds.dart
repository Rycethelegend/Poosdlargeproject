import 'dart:math';
import 'package:poosdalatro/game/boss_effects.dart';
import 'package:poosdalatro/game/cards.dart';
import 'package:poosdalatro/game/data/bosses.dart';

// A run is a series of Tables. Each Table has three rounds; the third one uses
// a Boss from data/bosses.dart. The run goes on until a round's target is missed.

class RoundInfo {
  final String name;
  final double targetScale;
  final int reward;
  const RoundInfo(this.name, this.targetScale, this.reward);
}

const List<RoundInfo> rounds = [
  RoundInfo('Warm-up', 1, 3),
  RoundInfo('Main Event', 1.5, 4),
  RoundInfo('High Roller', 2, 5),
];

const int highRoller = 2;

// Base targets for tables 1-8 (same as the website and multiplayer/rules.js)
const List<int> _tableTargets = [250, 600, 1300, 2600, 4800, 8500, 14000, 22000];
const double _lateGrowth = 1.6;

int tableBaseTarget(int table) {
  if (table <= _tableTargets.length) return _tableTargets[table - 1];
  // after table 8: grows 1.6x per table, rounded to the nearest 500
  final last = _tableTargets.last;
  return (last * pow(_lateGrowth, table - _tableTargets.length) / 500).round() *
      500;
}

int roundTarget(int table, int round) =>
    (tableBaseTarget(table) * rounds[round].targetScale).round();

final Map<String, BossInfo> bossesById = {for (final b in bosses) b.id: b};

// Only Bosses whose rules have been written get picked
final List<String> _playableBossIds =
    bosses.where((b) => bossEffects.containsKey(b.id)).map((b) => b.id).toList();

final _random = Random();

String randomBoss() => _playableBossIds[_random.nextInt(_playableBossIds.length)];

/// The rules of the Boss in play this round, or null outside the High Roller
BossRules? activeBossRules(int round, String bossId) =>
    round == highRoller ? bossEffects[bossId] : null;

class RoundRules {
  final String? activeBoss;
  final int hands;
  final int discards;
  final int handSize;
  final int maxSelect;
  const RoundRules(
      this.activeBoss, this.hands, this.discards, this.handSize, this.maxSelect);
}

/// Starting hands, discards and hand size for a round
RoundRules roundRules(int round, String bossId) {
  final boss = activeBossRules(round, bossId);
  return RoundRules(
    boss != null ? bossId : null,
    boss?.hands ?? 4,
    boss?.discards ?? 3,
    8 + (boss?.handSizeChange ?? 0),
    boss?.maxSelect ?? 5,
  );
}

/// True when the Boss in play stops this card from scoring
bool isBlocked(PlayingCard card, int round, String bossId) =>
    activeBossRules(round, bossId)?.blocksCard?.call(card) ?? false;

/// Money for winning a round: $1 per $10 held, up to $3
int savingsBonus(int money) => min(3, money ~/ 10);
