export async function handleLeaveRequests(client, method, queryParams) {
  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers: {
          'Access-Control-Allow-Origin': '*',  // or 'http://localhost:3000'
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed',
      }),
    };
  }

  // Extract query params
  const {
    user_id,
    status,
    start_date,
    end_date,
    page = 1,
    size = 10,
  } = queryParams;

  // Ensure page and size are numbers
  const pageNum = Number(page) || 1;
  const sizeNum = Number(size) || 10;
  const offset = (pageNum - 1) * sizeNum;

  // --- Build dynamic query ---
  let baseQuery = `
    SELECT 
      lr.leave_request_id,
      u.display_name,
      lp.leave_type,
      lr.start_date,
      lr.end_date,
      lr.total_days,
      lr.reason,
      lr.status,
      approver.display_name AS approver_name,
      lr.approved_at
    FROM leave_request lr
    JOIN users u ON lr.user_id = u.user_id
    JOIN leave_policy lp ON lr.leave_policy_id = lp.leave_policy_id
    LEFT JOIN users approver ON lr.approver_id = approver.user_id
    WHERE 1=1
  `;

  const values = [];
  let count = 1;

  if (user_id) {
    baseQuery += ` AND lr.user_id = $${count++}`;
    values.push(user_id);
  }

  if (status) {
    baseQuery += ` AND lr.status = $${count++}`;
    values.push(status);
  }

  if (start_date && end_date) {
    baseQuery += ` AND (
      lr.start_date BETWEEN $${count} AND $${count + 1}
      OR lr.end_date BETWEEN $${count} AND $${count + 1}
      OR (lr.start_date <= $${count} AND lr.end_date >= $${count + 1})
    )`;
    values.push(start_date, end_date);
    count += 2;
  } else if (start_date) {
    baseQuery += ` AND lr.start_date >= $${count++}`;
    values.push(start_date);
  } else if (end_date) {
    baseQuery += ` AND lr.end_date <= $${count++}`;
    values.push(end_date);
  }

  // --- Pagination ---
  const paginatedQuery = `${baseQuery} ORDER BY lr.created_at DESC LIMIT $${count++} OFFSET $${count++}`;
  values.push(sizeNum, offset);

  const result = await client.query(paginatedQuery, values);

  // --- Filtered total count ---
  let countQuery = `
    SELECT COUNT(*) AS total
    FROM leave_request lr
    WHERE 1=1
  `;
  const countValues = [];
  let c = 1;

  if (user_id) {
    countQuery += ` AND lr.user_id = $${c++}`;
    countValues.push(user_id);
  }
  if (status) {
    countQuery += ` AND lr.status = $${c++}`;
    countValues.push(status);
  }
  if (start_date && end_date) {
    countQuery += ` AND (
      lr.start_date BETWEEN $${c} AND $${c + 1}
      OR lr.end_date BETWEEN $${c} AND $${c + 1}
      OR (lr.start_date <= $${c} AND lr.end_date >= $${c + 1})
    )`;
    countValues.push(start_date, end_date);
    c += 2;
  } else if (start_date) {
    countQuery += ` AND lr.start_date >= $${c++}`;
    countValues.push(start_date);
  } else if (end_date) {
    countQuery += ` AND lr.end_date <= $${c++}`;
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
      message: 'Leave requests fetched successfully.',
      data: {
        pagination: {
          page: pageNum,
          size: sizeNum,
          total,
        },
        leaveRequests: result.rows,
      },
    }),
  };
}
