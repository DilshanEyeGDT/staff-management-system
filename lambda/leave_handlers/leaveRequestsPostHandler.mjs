export async function handleLeaveRequestsPOST(client, event) {
    const body = JSON.parse(event.body || '{}');
    const { user_id, leave_policy_id, start_date, end_date, reason } = body;
  
    if (!user_id || !leave_policy_id || !start_date || !end_date) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ success: false, message: 'Missing required fields.' }),
      };
    }
  
    // Validate start_date <= end_date
    if (new Date(start_date) > new Date(end_date)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ success: false, message: 'start_date cannot be after end_date.' }),
      };
    }
  
    try {
      // 1. Check leave_balance
      const balanceRes = await client.query(
        `SELECT remaining_days FROM leave_balance
         WHERE user_id = $1 AND leave_policy_id = $2`,
        [user_id, leave_policy_id]
      );
  
      if (balanceRes.rows.length === 0) {
        return {
          statusCode: 400,
          headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
          body: JSON.stringify({ success: false, message: 'No leave balance found for this type.' }),
        };
      }
  
      const remainingDays = balanceRes.rows[0].remaining_days;
      const totalDays = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
  
      if (totalDays > remainingDays) {
        return {
          statusCode: 400,
          headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
          body: JSON.stringify({ success: false, message: 'Requested days exceed remaining leave balance.' }),
        };
      }
  
      // 2. Check overlapping leave requests
      const overlapRes = await client.query(
        `SELECT * FROM leave_request
         WHERE user_id = $1
           AND status != 'rejected'
           AND (
             start_date BETWEEN $2 AND $3
             OR end_date BETWEEN $2 AND $3
             OR (start_date <= $2 AND end_date >= $3)
           )`,
        [user_id, start_date, end_date]
      );
  
      if (overlapRes.rows.length > 0) {
        return {
          statusCode: 400,
          headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
          body: JSON.stringify({ success: false, message: 'Leave request overlaps with existing leave.' }),
        };
      }
  
      // 3. Insert into leave_request
      const insertRes = await client.query(
        `INSERT INTO leave_request (user_id, leave_policy_id, start_date, end_date, reason)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user_id, leave_policy_id, start_date, end_date, reason || null]
      );
  
      const newLeave = insertRes.rows[0];
  
      // 4. Insert into leave_audit
      await client.query(
        `INSERT INTO leave_audit (leave_request_id, action, performed_by_user_id)
         VALUES ($1, 'pending', $2)`,
        [newLeave.leave_request_id, user_id]
      );
  
      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          message: 'Leave request created successfully.',
          data: newLeave,
        }),
      };
  
    } catch (err) {
      console.error('❌ POST leave request error:', err);
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
  