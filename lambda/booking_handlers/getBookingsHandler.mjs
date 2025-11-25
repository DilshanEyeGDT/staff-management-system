// booking_handlers/getBookingsHandler.mjs

/**
 * Exports:
 *  - handleGetBookings(client, event)
 *
 * Behavior:
 *  - GET /api/v1/bookings
 *  - GET /api/v1/bookings?booking_id=<id>
 *  - GET /api/v1/bookings?user_id=&room_id=&start_date=&end_date=&page=&size=
 *
 * Pagination defaults: page=1, size=10
 */

export async function handleGetBookings(client, event) {
  const q = event.queryStringParameters || {};
  const booking_id = q.booking_id || null;
  const user_id = q.user_id || null;
  const room_id = q.room_id || null;
  const start_date = q.start_date || null; // ISO date or timestamp string
  const end_date = q.end_date || null;
  const page = q.page ? parseInt(q.page, 10) : 1;
  const size = q.size ? parseInt(q.size, 10) : 10;

  if (page <= 0 || size <= 0) {
      return {
          statusCode: 400,
          headers: corsHeaders(),
          body: JSON.stringify({ success: false, message: 'Invalid pagination parameters.' }),
      };
  }

  try {
      // If booking_id is provided -> return single booking
      if (booking_id) {
          const singleQuery = `
              SELECT b.booking_id, b.start_time, b.end_time, b.status, b.idempotency_key,
                     b.created_at, b.updated_at,
                     u.display_name AS user_name,
                     r.room_name
              FROM bookings b
              JOIN users u ON b.user_id = u.user_id
              JOIN rooms r ON b.room_id = r.room_id
              WHERE b.booking_id = $1
              LIMIT 1;
          `;
          const res = await client.query(singleQuery, [booking_id]);

          if (res.rows.length === 0) {
              return {
                  statusCode: 404,
                  headers: corsHeaders(),
                  body: JSON.stringify({ success: false, message: 'Booking not found.' }),
              };
          }

          return {
              statusCode: 200,
              headers: corsHeaders(),
              body: JSON.stringify({ success: true, data: res.rows[0] }),
          };
      }

      // Build dynamic filters for list query
      const filters = [];
      const values = [];
      let idx = 1;

      if (user_id) {
          filters.push(`b.user_id = $${idx++}`);
          values.push(user_id);
      }

      if (room_id) {
          filters.push(`b.room_id = $${idx++}`);
          values.push(room_id);
      }

      if (start_date && end_date) {
          filters.push(`NOT (b.end_time < $${idx}::timestamp OR b.start_time > $${idx+1}::timestamp)`);
          values.push(start_date, end_date);
          idx += 2;
      } else if (start_date) {
          filters.push(`b.end_time >= $${idx++}::timestamp`);
          values.push(start_date);
      } else if (end_date) {
          filters.push(`b.start_time <= $${idx++}::timestamp`);
          values.push(end_date);
      }

      const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      // Count total
      const countQuery = `SELECT COUNT(*) AS total FROM bookings b ${whereClause};`;
      const countRes = await client.query(countQuery, values);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);

      const offset = (page - 1) * size;

      // Fetch data with ordering (latest created first)
      const dataQuery = `
          SELECT b.booking_id, b.start_time, b.end_time, b.status, b.idempotency_key,
                 b.created_at, b.updated_at,
                 u.display_name AS user_name,
                 r.room_name
          FROM bookings b
          JOIN users u ON b.user_id = u.user_id
          JOIN rooms r ON b.room_id = r.room_id
          ${whereClause}
          ORDER BY b.created_at DESC
          LIMIT $${idx++} OFFSET $${idx++};
      `;
      values.push(size, offset);

      const dataRes = await client.query(dataQuery, values);

      return {
          statusCode: 200,
          headers: corsHeaders(),
          body: JSON.stringify({
              success: true,
              page,
              size,
              total,
              data: dataRes.rows,
          }),
      };
  } catch (err) {
      console.error('❌ GET bookings error:', err);
      return {
          statusCode: 500,
          headers: corsHeaders(),
          body: JSON.stringify({ success: false, message: 'Internal server error', error: err.message }),
      };
  }
}

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,Idempotency-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
});
