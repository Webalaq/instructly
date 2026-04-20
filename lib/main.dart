import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';

// NOTE: Uncomment the imports below after running `flutterfire configure`
// to generate firebase_options.dart.
//
// import 'package:firebase_core/firebase_core.dart';
// import 'firebase_options.dart';
// import 'shared/services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ---------------------------------------------------------------------------
  // Firebase initialisation
  // ---------------------------------------------------------------------------
  // Uncomment this block after running `flutterfire configure`:
  //
  // try {
  //   await Firebase.initializeApp(
  //     options: DefaultFirebaseOptions.currentPlatform,
  //   );
  //   // Initialise FCM (request permissions, save token, wire listeners).
  //   await FcmService().initialize();
  // } catch (e) {
  //   debugPrint('Firebase init error: $e');
  // }

  runApp(const ProviderScope(child: InstructlyApp()));
}
