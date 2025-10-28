import 'package:flutter/material.dart';
import 'package:flutter_app/login_screen.dart';
import 'auth_service.dart';
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
                              Text(preferredUsername),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () async {
                      await AuthService().signOut();
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                        (route) => false,
                      );
                    },
                    child: const Text('Logout'),
                  ),
                ],
              ),
            ),
    );
  }
}
