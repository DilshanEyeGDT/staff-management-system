import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/screens/login_screen.dart';
import 'package:flutter_app/services/backend_sync_service.dart';
import '../services/auth_service.dart';
import 'package:amplify_flutter/amplify_flutter.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String email = '';
  String preferredUsername = '';
  bool isLoading = true;

  final BackendSyncService _userService = BackendSyncService(); // <-- ADDED

  @override
  void initState() {
    super.initState();
    _fetchUserAttributes();
  }

  Future<void> _fetchUserAttributes() async {
    try {
      final attributes = await Amplify.Auth.fetchUserAttributes();
      setState(() {
        email =
            attributes
                .firstWhere(
                  (attr) => attr.userAttributeKey.key == 'email',
                  orElse: () => const AuthUserAttribute(
                    userAttributeKey: CognitoUserAttributeKey.email,
                    value: '',
                  ),
                )
                .value ??
            '';
        preferredUsername =
            attributes
                .firstWhere(
                  (attr) => attr.userAttributeKey.key == 'preferred_username',
                  orElse: () => const AuthUserAttribute(
                    userAttributeKey: CognitoUserAttributeKey.preferredUsername,
                    value: '',
                  ),
                )
                .value ??
            '';
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      safePrint('Error fetching attributes: $e');
    }
  }

  // ------------------ NEW: update display name flow ------------------
  Future<void> _showEditDisplayNameDialog() async {
    final controller = TextEditingController(text: preferredUsername);
    final newName = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Edit display name'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(hintText: 'Enter display name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (newName != null && newName.isNotEmpty && newName != preferredUsername) {
      await _updateDisplayName(newName);
    }
  }

  Future<void> _updateDisplayName(String newName) async {
    setState(() => isLoading = true);
    try {
      // 1) Update Cognito preferred_username attribute
      final attr = CognitoUserAttributeKey.preferredUsername;
      final updateResult = await Amplify.Auth.updateUserAttribute(
        userAttributeKey: CognitoUserAttributeKey.preferredUsername,
        value: newName,
      );

      // updateResult.nextStep is used only if confirmation is required.
      if (updateResult.isUpdated == false) {
        // If Cognito requires confirmation step for this attribute, handle it.
        // For minimal flow we assume isUpdated == true. If not, show message.
        safePrint('Cognito update returned nextStep: ${updateResult.nextStep}');
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cognito requires confirmation for this attribute.'),
          ),
        );
        return;
      }

      // 2) Get access token (backend expects access token for /api/v1/me)
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final accessToken = session.userPoolTokensResult.value.accessToken.raw;

      // 3) Patch backend to update DB
      final resp = await _userService.updateDisplayName(accessToken, newName);

      if (resp.statusCode == 200 || resp.statusCode == 201) {
        // success: update UI
        setState(() {
          preferredUsername = newName;
          isLoading = false;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Display name updated')));
      } else {
        // backend failed -> inform user (Cognito already updated)
        setState(() => isLoading = false);
        safePrint('Backend update failed: ${resp.statusCode} ${resp.body}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to update server profile (${resp.statusCode})',
            ),
          ),
        );
      }
    } catch (e) {
      setState(() => isLoading = false);
      safePrint('Error updating display name: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update display name')),
      );
    }
  }
  // ------------------ END NEW flow ------------------

  Future<void> _logout(BuildContext context) async {
    try {
      // ✅ 1. Get access token before signing out
      final session =
          await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
      final idToken = session.userPoolTokensResult.value.idToken.raw;

      // ✅ 3. Sync logout with your backend
      await BackendSyncService().syncLogout(idToken);

      // ✅ 2. Sign out from Cognito
      await AuthService().signOut();

      // ✅ 4. Navigate to login screen
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      safePrint('Logout error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Profile',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              const Text(
                                'My Email: ',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(email),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Text(
                                'Username: ',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Expanded(child: Text(preferredUsername)),
                              const SizedBox(width: 8),
                              ElevatedButton(
                                onPressed:
                                    _showEditDisplayNameDialog, // <-- ADDED
                                child: const Text('Edit'),
                                style: ElevatedButton.styleFrom(
                                  minimumSize: const Size(80, 36),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () async {
                      await _logout(context);
                    },
                    child: const Text('Logout'),
                  ),
                ],
              ),
            ),
    );
  }
}
