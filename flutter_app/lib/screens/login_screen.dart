import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter_app/services/backend_sync_service.dart';
import '../services/auth_service.dart';
import 'home_screen.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final pass = TextEditingController();
  final auth = AuthService();
  String? message;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.grey[100],
    body: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Card(
          elevation: 6,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Title
                const Text(
                  'Staff Management Login',
                  key: Key('login_title'),
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),

                // Email Field
                const SizedBox(height: 24),
                TextField(
                  key: const Key('email_field'),
                  controller: email,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.email),
                  ),
                ),
                const SizedBox(height: 16),

                // Password Field
                TextField(
                  key: const Key('password_field'),
                  controller: pass,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    prefixIcon: const Icon(Icons.lock),
                  ),
                ),
                const SizedBox(height: 24),

                // Sign In Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    key: const Key('sign_in_button'),
                    onPressed: _login,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Sign In',
                      style: TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Register & Forgot Password Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      key: const Key('register_button'),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const RegisterScreen(),
                        ),
                      ),
                      child: const Text('Register'),
                    ),
                    TextButton(
                      key: const Key('forgot_password_button'),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ForgotPasswordScreen(),
                        ),
                      ),
                      child: const Text('Forgot Password?'),
                    ),
                  ],
                ),
                if (message != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      message!,
                      key: const Key('login_error_message'),
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  Future<void> _login() async {
    try {
      final res = await auth.signIn(email.text.trim(), pass.text);

      if (res.isSignedIn) {
        // ✅ Fetch Cognito user attributes
        final user = await Amplify.Auth.getCurrentUser();
        final attributes = await Amplify.Auth.fetchUserAttributes();

        final sub = user.userId;
        final emailAttr = attributes
            .firstWhere((a) => a.userAttributeKey.key == 'email')
            .value;
        final displayNameAttr = attributes
            .firstWhere(
              (a) => a.userAttributeKey.key == 'preferred_username',
              orElse: () => const AuthUserAttribute(
                userAttributeKey: CognitoUserAttributeKey.name,
                value: 'Unknown',
              ),
            )
            .value;

        // ✅ Get Cognito session & tokens
        final session =
            await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
        final accessToken = session.userPoolTokens?.accessToken;
        final idToken = session.userPoolTokens?.idToken;

        // print("Access token: $accessToken");
        // print("id token: $idToken");

        if (accessToken != null && idToken != null) {
          // ✅ 1. Sync user record with backend
          await BackendSyncService().syncUser(
            sub: sub,
            email: emailAttr,
            username: emailAttr,
            displayName: displayNameAttr,
            accessToken: accessToken.raw,
          );

          // ✅ 2. Record login audit
          await BackendSyncService().syncLogin(idToken.raw);
        }

        // ✅ Navigate to home
        if (!mounted) return;
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      } else if (res.nextStep?.signInStep == 'CONFIRM_SIGN_IN_WITH_SMS_MFA') {
        final code = await _showCodeDialog();
        if (code != null) {
          await Amplify.Auth.confirmSignIn(confirmationValue: code);

          // ✅ After MFA confirm
          final session =
              await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
          final accessToken = session.userPoolTokens?.accessToken;
          final idToken = session.userPoolTokens?.idToken;

          if (accessToken != null && idToken != null) {
            final user = await Amplify.Auth.getCurrentUser();
            final attributes = await Amplify.Auth.fetchUserAttributes();
            final emailAttr = attributes
                .firstWhere((a) => a.userAttributeKey.key == 'email')
                .value;
            final displayNameAttr = attributes
                .firstWhere(
                  (a) => a.userAttributeKey.key == 'preferred_username',
                  orElse: () => const AuthUserAttribute(
                    userAttributeKey: CognitoUserAttributeKey.name,
                    value: 'Unknown',
                  ),
                )
                .value;

            // ✅ Sync user + audit
            await BackendSyncService().syncUser(
              sub: user.userId,
              email: emailAttr,
              username: emailAttr,
              displayName: displayNameAttr,
              accessToken: accessToken.raw,
            );

            await BackendSyncService().syncLogin(idToken.raw);
          }

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        }
      } else {
        setState(() => message = 'Next step: ${res.nextStep?.signInStep}');
      }
    } catch (e) {
      setState(() => message = e.toString());
    }
  }

  Future<String?> _showCodeDialog() async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        key: const Key('mfa_dialog'),
        title: const Text('Enter MFA code'),
        content: TextField(key: const Key('mfa_code_field'), controller: ctrl),
        actions: [
          TextButton(
            key: const Key('mfa_cancel_button'),
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            key: const Key('mfa_ok_button'),
            onPressed: () => Navigator.pop(context, ctrl.text),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
