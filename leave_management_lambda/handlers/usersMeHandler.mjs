// handlers/usersMeHandler.mjs
import { syncUser } from '../utils/userSync.mjs';

export async function handleUsersMe(client, event) {
  try {
    // Sync the user and get the DB record
    const { currentUser } = await syncUser(client, event);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        user: {
          user_id: currentUser.user_id,
          display_name: currentUser.display_name,
        },
      }),
    };
  } catch (err) {
    console.error('❌ GET /users/me error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({ success: false, message: 'Internal server error', error: err.message }),
    };
  }
}
