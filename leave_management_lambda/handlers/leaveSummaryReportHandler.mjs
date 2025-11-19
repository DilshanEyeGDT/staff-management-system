// handlers/leaveSummaryReportHandler.mjs
export async function handleLeaveSummaryReport(client, event) {
    const query = event.queryStringParameters || {};
    const { start_date, end_date, user_id } = query;
  
    if (!start_date || !end_date) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ message: 'start_date and end_date are required' }),
      };
    }
  
    try {
      // 1️⃣ Leave summary
      const leaveSummaryRes = await client.query(
        `
        SELECT 
          u.user_id,
          u.display_name,
          lp.leave_type,
          COALESCE(SUM(lr.total_days), 0) AS total_taken,
          COALESCE(lb.remaining_days, lp.max_days_per_year) AS remaining_days
        FROM users u
        LEFT JOIN leave_request lr 
          ON lr.user_id = u.user_id 
          AND lr.status = 'approved' 
          AND lr.start_date >= $1 
          AND lr.end_date <= $2
        LEFT JOIN leave_policy lp 
          ON lp.leave_policy_id = lr.leave_policy_id OR lp.leave_policy_id IS NOT NULL
        LEFT JOIN leave_balance lb 
          ON lb.user_id = u.user_id AND lb.leave_policy_id = lp.leave_policy_id
        WHERE ($3::INT IS NULL OR u.user_id = $3::INT)
        GROUP BY u.user_id, u.display_name, lp.leave_type, lb.remaining_days, lp.max_days_per_year
        ORDER BY u.display_name, lp.leave_type
        `,
        [start_date, end_date, user_id || null]
      );
  
      // 2️⃣ Attendance summary
      const attendanceRes = await client.query(
        `
        SELECT 
          user_id,
          SUM(CASE WHEN attendance_status='present' THEN 1 ELSE 0 END) AS total_present,
          SUM(CASE WHEN attendance_status='absent' THEN 1 ELSE 0 END) AS total_absent,
          SUM(CASE WHEN attendance_status='leave' THEN 1 ELSE 0 END) AS total_leave
        FROM attendance_log
        WHERE date BETWEEN $1 AND $2
        AND ($3::INT IS NULL OR user_id = $3::INT)
        GROUP BY user_id
        `,
        [start_date, end_date, user_id || null]
      );
  
      // Map attendance by user_id
      const attendanceMap = {};
      attendanceRes.rows.forEach(row => {
        attendanceMap[row.user_id] = {
          total_present: Number(row.total_present),
          total_absent: Number(row.total_absent),
          total_leave: Number(row.total_leave),
        };
      });
  
      // Combine leave + attendance per user
      const report = leaveSummaryRes.rows.map(row => ({
        user_id: row.user_id,
        display_name: row.display_name,
        leave_type: row.leave_type,
        total_leave_taken: Number(row.total_taken),
        remaining_days: Number(row.remaining_days),
        attendance: attendanceMap[row.user_id] || { total_present: 0, total_absent: 0, total_leave: 0 },
      }));
  
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          message: 'Leave & attendance summary fetched successfully',
          data: report,
        }),
      };
    } catch (err) {
      console.error('❌ Leave summary report error:', err);
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
  