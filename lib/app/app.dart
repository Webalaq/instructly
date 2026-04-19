import 'package:flutter/material.dart';
import 'theme/app_theme.dart';

class InstructlyApp extends StatelessWidget {
  const InstructlyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Instructly',
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
      home: const Scaffold(
        body: Center(child: Text('Instructly')),
      ),
    );
  }
}
