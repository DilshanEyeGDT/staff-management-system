// handlers/attendanceHandler.mjs

export async function handleClockIn(client, event) {
    const userId = event.currentUser?.user_id;
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'User not found' }),
      };
    }
  
    const insertQuery = `
      INSERT INTO attendance_log (user_id, clock_in_time)
      VALUES ($1, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
  
    try {
      const result = await client.query(insertQuery, [userId]);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ success: true, attendanceRecord: result.rows[0] }),
      };
    } catch (err) {
      console.error('Clock-in error:', err);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'Internal server error', error: err.message }),
      };
    }
  }
  
  export async function handleClockOut(client, event) {
    const userId = event.currentUser?.user_id;
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'User not found' }),
      };
    }
  
    const insertQuery = `
      INSERT INTO attendance_log (user_id, clock_out_time)
      VALUES ($1, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
  
    try {
      const result = await client.query(insertQuery, [userId]);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ success: true, attendanceRecord: result.rows[0] }),
      };
    } catch (err) {
      console.error('Clock-out error:', err);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'Internal server error', error: err.message }),
      };
    }
  }  