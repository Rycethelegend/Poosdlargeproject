/// Same list as the web app's credits.ts, keep them matching
class TeamMember {
  final String name;
  final String role;
  const TeamMember(this.name, this.role);
}

class AssetCredit {
  final String what;
  final String creator;
  final String source;
  final String license;
  const AssetCredit(this.what, this.creator, this.source, this.license);
}

class Credits {
  static const List<TeamMember> team = [
    TeamMember('Levi Buffington', 'Project Manager'),
    TeamMember('Alec Hayes', 'Frontend Developer'),
    TeamMember('Nathan Melloul', 'Frontend Developer'),
    TeamMember('Rudolph Antoine', 'API Developer'),
    TeamMember('Wenhuang Lin', 'Frontend/Mobile Developer'),
    TeamMember('Frank Yang', 'API Developer'),
    TeamMember('Jake Arnold', 'Database Engineer'),
  ];

  static const List<AssetCredit> assets = [
    AssetCredit('Playing card, poker chip and card deck sprites',
        'IvoryRed (Pixel Poker Cards)',
        'https://ivoryred.itch.io/pixel-poker-cards', 'CC BY 4.0'),
    AssetCredit('Joker images', 'Our Team', '', ''),
    AssetCredit('Table background patterns', 'Steve Schoger (Hero Patterns)',
        'https://heropatterns.com', 'CC BY 4.0'),
  ];
}
