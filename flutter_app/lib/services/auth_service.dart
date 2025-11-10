import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';

class AuthService {
  // ✅ Sign Up
  Future<SignUpResult> signUp(
    String email,
    String password,
    String? username,
  ) async {
    // ignore: deprecated_member_use
    final options = CognitoSignUpOptions(
      userAttributes: {
        CognitoUserAttributeKey.email: email,
        if (username != null)
          CognitoUserAttributeKey.preferredUsername: username,
      },
    );
    return await Amplify.Auth.signUp(
      username: email,
      password: password,
      options: options,
    );
  }

  // ✅ Confirm Sign Up
  Future<SignUpResult> confirmSignUp(String email, String code) async {
    final result = await Amplify.Auth.confirmSignUp(
      username: email,
      confirmationCode: code,
    );
    return result;
  }

  // ✅ Sign In (updated)
  Future<SignInResult> signIn(String email, String password) async {
    try {
      await _ensureAmplifyConfigured(); // 🟢 ensure Amplify ready

      // 🔹 Check if a user is already signed in
      final session = await Amplify.Auth.fetchAuthSession();
      if (session.isSignedIn) {
        safePrint('⚠️ A user is already signed in. Signing out first...');
        await Amplify.Auth.signOut();
      }

      // 🔹 Proceed with login
      final result = await Amplify.Auth.signIn(
        username: email,
        password: password,
      );

      safePrint('✅ Login successful');
      return result;
    } on AuthException catch (e) {
      safePrint('❌ Login error: ${e.message}');
      rethrow;
    }
  }

  // ✅ Sign Out
  Future<void> signOut() async {
    await Amplify.Auth.signOut();
  }

  // ✅ Reset Password
  Future<ResetPasswordResult> resetPassword(String email) async {
    return await Amplify.Auth.resetPassword(username: email);
  }

  // ✅ Confirm Reset Password
  Future<void> confirmResetPassword(
    String email,
    String newPassword,
    String code,
  ) async {
    await Amplify.Auth.confirmResetPassword(
      username: email,
      newPassword: newPassword,
      confirmationCode: code,
    );
  }

  // Fetch Access Token (returns a plain String or null)
  Future<String?> getAccessToken() async {
    final session = await Amplify.Auth.fetchAuthSession();
    if (session is CognitoAuthSession && session.isSignedIn) {
      // New SDK method — safely access token string
      final token = session.userPoolTokensResult.value.accessToken.raw;
      return token;
    }
    return null;
  }

  Future<void> _ensureAmplifyConfigured() async {
    try {
      // This throws if Amplify is not configured
      await Amplify.Auth.fetchAuthSession();
    } catch (e) {
      safePrint("⚠️ Amplify not ready yet, waiting...");
      await Future.delayed(const Duration(seconds: 2));
      // Try again once
      await Amplify.Auth.fetchAuthSession();
    }
  }
}
