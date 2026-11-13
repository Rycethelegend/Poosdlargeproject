import 'package:flutter/material.dart';
import 'package:poosdalatro/utils/credits.dart';

class CreditsDialog extends StatelessWidget {
  const CreditsDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    const bold = TextStyle(fontWeight: FontWeight.bold);

    return AlertDialog(
      title: const Text('Credits'),
      content: SizedBox(
        width: 460,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Team', style: text.titleMedium),
              const Divider(),
              for (final member in Credits.team)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      Expanded(child: Text(member.name, style: bold)),
                      Text(member.role),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              Text('Art and fonts', style: text.titleMedium),
              const Divider(),
              for (final asset in Credits.assets)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(asset.what, style: bold),
                      Text(asset.license.isEmpty
                          ? asset.creator
                          : '${asset.creator} · ${asset.license}'),
                      if (asset.source.isNotEmpty)
                        SelectableText(asset.source, style: text.bodySmall),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              Text(
                  'Poosdalatro was made for COP 4331C at the University of Central Florida, Fall 2026.',
                  style: text.bodySmall),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }
}
