export const handleLeaveBalance = async (client, event) => {
    const userIdFromQuery = event.queryStringParameters?.user_id;
  
    if (!userIdFromQuery) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ error: 'Missing query parameter: user_id' }),
      };
    }
  
    const leaveBalanceQuery = `
      SELECT 
        u.display_name,
        lp.leave_policy_id,
        lp.leave_type,
        lb.year,
        lb.allocated_days,
        lb.used_days,
        lb.remaining_days
      FROM leave_balance lb
      JOIN users u ON lb.user_id = u.user_id
      JOIN leave_policy lp ON lb.leave_policy_id = lp.leave_policy_id
      WHERE lb.user_id = $1
      ORDER BY lp.leave_policy_id;
    `;
  
    const leaveRes = await client.query(leaveBalanceQuery, [userIdFromQuery]);
    const displayName = leaveRes.rows.length > 0 ? leaveRes.rows[0].display_name : null;
  
    const leaveBalanceData = leaveRes.rows.map(row => ({
      leave_type_id: row.leave_policy_id, // <<--- added
      leave_type: row.leave_type,
      year: row.year,
      allocated_days: row.allocated_days,
      used_days: row.used_days,
      remaining_days: row.remaining_days,
    }));
  
    return {
      statusCode: 200,
      headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
      body: JSON.stringify({
        requested_user_id: userIdFromQuery,
        display_name: displayName,
        leave_balance: leaveBalanceData,
      }),
    };
  };
  