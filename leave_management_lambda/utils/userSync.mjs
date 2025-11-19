export const syncUser = async (client, event) => {
  const claims = event.requestContext?.authorizer?.claims || {};
  const sub = claims.sub;
  const email = claims.email;
  const displayName = claims.preferred_username || claims.name || null;
  const username = claims['cognito:username'] || null;

  if (!sub || !email) {
    throw new Error('Missing Cognito user details (sub or email).');
  }

  let currentUser = null;
  let userSyncMessage = '';

  // Check if user exists by cognito_sub
  const checkSubResult = await client.query('SELECT * FROM users WHERE cognito_sub = $1', [sub]);

  if (checkSubResult.rows.length > 0) {
    // User exists → always update display_name
    const updateResult = await client.query(
      `UPDATE users
       SET display_name = $1
       WHERE cognito_sub = $2
       RETURNING *;`,
      [displayName, sub]
    );
    currentUser = updateResult.rows[0];
    userSyncMessage = 'User exists. display_name updated.';
  } else {
    // Check by email if cognito_sub not found
    const checkEmailResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);

    if (checkEmailResult.rows.length > 0) {
      // Update cognito_sub, username, and display_name
      const updateResult = await client.query(
        `UPDATE users
         SET cognito_sub = $1, username = $2, display_name = $3
         WHERE email = $4
         RETURNING *;`,
        [sub, username, displayName, email]
      );
      currentUser = updateResult.rows[0];
      userSyncMessage = 'User updated successfully with new cognito_sub and display_name.';
    } else {
      // Create new user
      const insertResult = await client.query(
        `INSERT INTO users (cognito_sub, username, email, display_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *;`,
        [sub, username, email, displayName]
      );
      currentUser = insertResult.rows[0];
      userSyncMessage = 'New user created successfully.';
    }
  }

  return { currentUser, userSyncMessage };
};