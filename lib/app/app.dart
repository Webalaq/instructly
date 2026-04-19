import 'package:flutter/material.dart';

class InstructlyApp extends StatelessWidget {
  const InstructlyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Instructly',
      home: const Scaffold(
        body: Center(child: Text('Instructly')),
      ),
    );
  }
}
