// handlers/attendanceHandler.mjs

export async function handleAttendanceLogs(client, queryParams) {
    const { user_id, start_date, end_date, page = 1, size = 10 } = queryParams;
  
    if (!user_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({ success: false, message: 'Missing required parameter: user_id' }),
      };
    }
  
    const pageNum = Number(page) || 1;
    const sizeNum = Number(size) || 10;
    const offset = (pageNum - 1) * sizeNum;
  
    // --- Fetch attendance logs ---
    let baseQuery = `
      SELECT attendance_log_id, clock_in_time, clock_out_time, attendance_status, date
      FROM attendance_log
      WHERE user_id = $1
    `;
    const values = [user_id];
    let count = 2;
  
    if (start_date && end_date) {
      baseQuery += ` AND date BETWEEN $${count} AND $${count + 1}`;
      values.push(start_date, end_date);
      count += 2;
    } else if (start_date) {
      baseQuery += ` AND date >= $${count++}`;
      values.push(start_date);
    } else if (end_date) {
      baseQuery += ` AND date <= $${count++}`;
      values.push(end_date);
    }
  
    const paginatedQuery = `${baseQuery} ORDER BY date DESC LIMIT $${count++} OFFSET $${count++}`;
    values.push(sizeNum, offset);
  
    const result = await client.query(paginatedQuery, values);
  
    // --- Count total ---
    let countQuery = `SELECT COUNT(*) AS total FROM attendance_log WHERE user_id = $1`;
    const countValues = [user_id];
    let c = 2;
  
    if (start_date && end_date) {
      countQuery += ` AND date BETWEEN $${c} AND $${c + 1}`;
      countValues.push(start_date, end_date);
      c += 2;
    } else if (start_date) {
      countQuery += ` AND date >= $${c++}`;
      countValues.push(start_date);
    } else if (end_date) {
      countQuery += ` AND date <= $${c++}`;
      countValues.push(end_date);
    }
  
    const countResult = await client.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total, 10);
  
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Attendance logs fetched successfully.',
        data: {
          pagination: {
            page: pageNum,
            size: sizeNum,
            total,
          },
          attendanceLogs: result.rows,
        },
      }),
    };
  }
  