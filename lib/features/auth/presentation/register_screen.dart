import 'package:flutter/material.dart';

class RegisterScreen extends StatelessWidget {
  final bool isStudent;
  final String? inviteCode;
  const RegisterScreen({super.key, this.isStudent = false, this.inviteCode});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Register — to be implemented')));
  }
}
