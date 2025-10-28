import 'package:flutter/material.dart';
import 'package:flutter_app/login_screen.dart';
import 'auth_service.dart';

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
    appBar: AppBar(title: const Text('Register')),
    body: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: email,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          TextField(
            controller: pass,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          TextField(
            controller: preferredUsername,
            decoration: const InputDecoration(labelText: 'Preferred Username'),
          ),
          if (showCodeField)
            TextField(
              controller: code,
              decoration: const InputDecoration(labelText: 'Confirmation Code'),
            ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _handleAction,
            child: Text(showCodeField ? 'Confirm' : 'Register'),
          ),
          if (msg != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Text(msg!, style: const TextStyle(color: Colors.red)),
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
