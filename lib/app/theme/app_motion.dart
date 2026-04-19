import 'package:flutter/animation.dart';

abstract final class AppMotion {
  static const fast = Duration(milliseconds: 150);
  static const normal = Duration(milliseconds: 300);
  static const slow = Duration(milliseconds: 500);
  static const stagger = Duration(milliseconds: 50);
  static const standard = Curves.easeInOut;
  static const enter = Curves.easeOut;
  static const exit = Curves.easeIn;
  static const bounce = Curves.elasticOut;
}
