export async function handleGetUserDisplayName(client, queryParams) {
    const { user_id } = queryParams;
  
    try {
      if (user_id) {
        // Single user
        const result = await client.query(
          `SELECT display_name FROM users WHERE user_id = $1`,
          [user_id]
        );
  
        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
            body: JSON.stringify({
              success: false,
              message: "User not found"
            })
          };
        }
  
        return {
          statusCode: 200,
          headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
          body: JSON.stringify({
            display_name: result.rows[0].display_name
          })
        };
      } else {
        // Return all users
        const result = await client.query(
          `SELECT user_id, display_name FROM users ORDER BY user_id ASC`
        );
  
        return {
          statusCode: 200,
          headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
          body: JSON.stringify(result.rows)
        };
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: "Internal server error",
          error: err.message
        })
      };
    }
  }
  