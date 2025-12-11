import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter_app/services/go_sync_service.dart';

class EventFetchService {
  final GoSyncService goService = GoSyncService();

  // Fetch only events created by current user
  Future<List<Map<String, dynamic>>> fetchMyEvents() async {
    // Get ID token
    final session = await Amplify.Auth.fetchAuthSession() as CognitoAuthSession;
    final idToken = session.userPoolTokensResult.value.idToken.raw;

    // Get current user ID
    final userId = await goService.getCurrentUserId(idToken);
    if (userId == null) return [];

    // Get all events
    final allEvents = await goService.fetchAllEvents();

    // Return only events created by logged-in user
    return allEvents.where((e) => e["created_by"] == userId).toList();
  }
}
