import 'package:flutter/material.dart';
import 'package:flutter_app/screens/login_screen.dart';
import '../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final email = TextEditingController();
  final pass = TextEditingController();
  final preferredUsername = TextEditingController();
  final code = TextEditingController();
  final auth = AuthService();
  String? msg;
  bool showCodeField = false;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Register'),
      key: const Key('register_appbar'),
    ),
    body: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Email, Password, Preferred Username, Confirmation Code Fields
          TextField(
            key: const Key('register_email_field'),
            controller: email,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          TextField(
            key: const Key('register_password_field'),
            controller: pass,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          TextField(
            key: const Key('register_username_field'),
            controller: preferredUsername,
            decoration: const InputDecoration(labelText: 'Preferred Username'),
          ),
          if (showCodeField)
            TextField(
              key: const Key('register_code_field'),
              controller: code,
              decoration: const InputDecoration(labelText: 'Confirmation Code'),
            ),
          const SizedBox(height: 12),
          ElevatedButton(
            key: const Key('register_action_button'),
            onPressed: _handleAction,
            child: Text(showCodeField ? 'Confirm' : 'Register'),
          ),
          if (msg != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(
                msg!,
                key: const Key('register_message_text'),
                style: const TextStyle(color: Colors.red),
              ),
            ),
        ],
      ),
    ),
  );

  Future<void> _handleAction() async {
    try {
      if (!showCodeField) {
        if (preferredUsername.text.trim().isEmpty) {
          setState(() => msg = 'Please enter a preferred username');
          return;
        }

        await auth.signUp(
          email.text.trim(),
          pass.text.trim(),
          preferredUsername.text.trim(),
        );

        setState(() {
          msg = 'Check your email for verification code';
          showCodeField = true;
        });
      } else {
        await auth.confirmSignUp(email.text.trim(), code.text.trim());
        setState(() => msg = 'Registration complete! You can now log in.');

        Future.delayed(const Duration(seconds: 1), () {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (route) => false,
          );
        });
      }
    } catch (e) {
      setState(() => msg = e.toString());
    }
  }
}
