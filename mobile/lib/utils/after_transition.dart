import 'package:flutter/widgets.dart';

/// Runs [action] once the screen has finished sliding or fading in, so work
/// like a network request doesn't make the transition stutter
void afterTransition(BuildContext context, VoidCallback action) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    if (!context.mounted) return;
    final animation = ModalRoute.of(context)?.animation;
    if (animation == null || animation.isCompleted) return action();

    void onStatus(AnimationStatus status) {
      if (status == AnimationStatus.completed) {
        animation.removeStatusListener(onStatus);
        if (context.mounted) action();
      }
    }

    animation.addStatusListener(onStatus);
  });
}
