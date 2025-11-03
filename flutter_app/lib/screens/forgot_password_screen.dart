import 'package:flutter/material.dart';
import 'package:flutter_app/screens/login_screen.dart';
import '../services/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final email = TextEditingController();
  final code = TextEditingController();
  final newPass = TextEditingController();
  final auth = AuthService();
  String? msg;
  bool showConfirm = false;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Reset Password')),
    body: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: email,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          if (showConfirm) ...[
            TextField(
              controller: code,
              decoration: const InputDecoration(labelText: 'Confirmation Code'),
            ),
            TextField(
              controller: newPass,
              decoration: const InputDecoration(labelText: 'New Password'),
              obscureText: true,
            ),
          ],
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _handleAction,
            child: Text(showConfirm ? 'Confirm Reset' : 'Send Code'),
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
      if (!showConfirm) {
        await auth.resetPassword(email.text.trim());
        setState(() {
          msg = 'Verification code sent to your email';
          showConfirm = true;
        });
      } else {
        await auth.confirmResetPassword(
          email.text.trim(),
          newPass.text.trim(),
          code.text.trim(),
        );
        setState(() => msg = 'Password reset successful!');

        // ✅ Redirect to login screen after successful reset
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
