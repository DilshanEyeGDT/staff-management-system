export const handleHealthCheck = async (client, event) => {
    try {
      // Quick test query to verify DB connectivity
      const result = await client.query('SELECT NOW() as db_time;');
  
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          status: 'ok',
          message: 'Lambda and Database connection healthy.',
          db_time: result.rows[0].db_time,
          //event: event,
        }),
      };
    } catch (err) {
      console.error('❌ Health Check Error:', err);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'error',
          message: 'Database connection failed.',
          error: err.message,
        }),
      };
    }
  };
  