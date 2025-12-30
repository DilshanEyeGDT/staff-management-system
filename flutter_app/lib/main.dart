import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'services/amplify_configuration.dart';
import 'screens/login/login_screen.dart';
import 'package:flutter_driver/driver_extension.dart';

void main() async {
  // 1. Enable Flutter Driver extension FIRST
  enableFlutterDriverExtension();

  // 2. Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // 3. Initialize Amplify BEFORE running the app
  bool configured = false;
  try {
    await Amplify.addPlugin(AmplifyAuthCognito());
    await Amplify.configure(amplifyconfig);
    configured = true;
  } catch (e) {
    safePrint('Amplify configuration error: $e');
    configured = true; // Continue even if config fails
  }

  // 4. Now run the app
  runApp(MyApp(configured: configured));
}

class MyApp extends StatelessWidget {
  final bool configured;

  const MyApp({super.key, required this.configured});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Staff Login',
      debugShowCheckedModeBanner: false,
      home: configured
          ? const LoginScreen()
          : const Scaffold(body: Center(child: CircularProgressIndicator())),
    );
  }
}
