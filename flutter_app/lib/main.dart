import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'services/amplify_configuration.dart';
import 'screens/login/login_screen.dart';
// import 'package:flutter_driver/driver_extension.dart';

void main() {
  //enableFlutterDriverExtension();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});
  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool _configured = false;

  @override
  void initState() {
    super.initState();
    _initAmplify();
  }

  Future<void> _initAmplify() async {
    try {
      await Amplify.addPlugin(AmplifyAuthCognito());
      await Amplify.configure(amplifyconfig);
      setState(() => _configured = true);
    } catch (_) {
      setState(() => _configured = true); // ignore re-configure errors
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Staff Login',
      debugShowCheckedModeBanner: false,
      home: _configured
          ? const LoginScreen()
          : const Scaffold(body: Center(child: CircularProgressIndicator())),
    );
  }
}
