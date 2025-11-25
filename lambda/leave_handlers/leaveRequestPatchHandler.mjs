// handlers/leaveRequestPatchHandler.mjs

export async function handleLeaveRequestPatch(client, event) {
  const leaveRequestId = event.queryStringParameters?.id;
  if (!leaveRequestId) {
    return {
      statusCode: 400,
      headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
      body: JSON.stringify({ message: 'Missing path parameter: id' }),
    };
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
      body: JSON.stringify({ message: 'Invalid JSON body' }),
    };
  }

  const { status, comment } = body;

  if (!status || !['approved', 'rejected', 'cancelled'].includes(status)) {
    return {
      statusCode: 400,
      headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
      body: JSON.stringify({ message: 'Invalid or missing status' }),
    };
  }

  try {
    await client.query('BEGIN');

    // 1️⃣ Fetch leave request info
    const leaveRes = await client.query(
      `SELECT * FROM leave_request WHERE leave_request_id = $1 FOR UPDATE`,
      [leaveRequestId]
    );

    if (leaveRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'Leave request not found' }),
      };
    }

    const leaveRequest = leaveRes.rows[0];

    // 2️⃣ Fetch approver user_id
    const cognitoSub = event.requestContext?.authorizer?.claims?.sub;
    const approverLookup = await client.query(
      `SELECT user_id FROM users WHERE cognito_sub = $1`,
      [cognitoSub]
    );

    if (approverLookup.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'Approver not found in system' }),
      };
    }

    const approverId = approverLookup.rows[0].user_id;

    // 3️⃣ If approved → validate and update leave_balance
    if (status === 'approved') {
      const balanceRes = await client.query(
        `SELECT * FROM leave_balance
         WHERE user_id = $1 AND leave_policy_id = $2
         FOR UPDATE`,
        [leaveRequest.user_id, leaveRequest.leave_policy_id]
      );

      if (balanceRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          statusCode: 400,
          headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
          body: JSON.stringify({ message: 'Leave balance not found for this user/type' }),
        };
      }

      const balance = balanceRes.rows[0];

      if (leaveRequest.total_days > balance.remaining_days) {
        await client.query('ROLLBACK');
        return {
          statusCode: 400,
          headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
          body: JSON.stringify({ message: 'Not enough remaining leave days' }),
        };
      }

      // Update used_days only
      await client.query(
        `UPDATE leave_balance
         SET used_days = used_days + $1,
             last_updated = CURRENT_TIMESTAMP
         WHERE leave_balance_id = $2`,
        [leaveRequest.total_days, balance.leave_balance_id]
      );
    }

    // 4️⃣ Update leave_request
    const updatedRequestRes = await client.query(
      `UPDATE leave_request
       SET status = $1::leave_status,
           approver_id = CASE WHEN $1::leave_status='approved' THEN $2::integer ELSE approver_id END,
           approved_at = CASE WHEN $1::leave_status='approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE leave_request_id = $3
       RETURNING *`,
      [status, approverId, leaveRequestId]
    );    

    // 5️⃣ Insert into leave_audit
    await client.query(
      `INSERT INTO leave_audit (leave_request_id, action, performed_by_user_id, comment)
       VALUES ($1, $2::leave_action, $3, $4)`,
      [leaveRequestId, status, approverId, comment || null]
    );    

    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
      body: JSON.stringify({
        success: true,
        leaveRequest: updatedRequestRes.rows[0],
      }),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ PATCH leave request error:', err);
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
