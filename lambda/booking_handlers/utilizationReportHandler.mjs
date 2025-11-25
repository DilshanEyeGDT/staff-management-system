// booking_handlers/utilizationReportHandler.mjs

/**
 * GET /api/v1/reports/utilization?start_date=&end_date=&group_by=
 *
 * Query Parameters:
 *  - start_date (required) – ISO date string
 *  - end_date (required) – ISO date string
 *  - group_by (optional) – 'room' or 'time' (default: 'room')
 *
 * Returns KPIs:
 *  - total_bookings
 *  - total_duration_hours
 *  - utilization_percentage (based on 9AM-6PM availability)
 */

export async function handleUtilizationReport(client, event) {
    const q = event.queryStringParameters || {};
    const start_date = q.start_date;
    const end_date = q.end_date;
    const group_by = q.group_by === 'time' ? 'time' : 'room'; // default 'room'
  
    if (!start_date || !end_date) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, message: 'Missing required query parameters: start_date and end_date' }),
      };
    }
  
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, message: 'Invalid date range' }),
      };
    }
  
    try {
      let reportQuery = '';
      let values = [start.toISOString(), end.toISOString()];
  
      if (group_by === 'room') {
        reportQuery = `
          SELECT
            r.room_id,
            r.room_name,
            COUNT(b.booking_id) AS total_bookings,
            SUM(EXTRACT(EPOCH FROM (LEAST(b.end_time, $2::timestamp) - GREATEST(b.start_time, $1::timestamp))) / 3600) AS total_duration_hours,
            (SUM(EXTRACT(EPOCH FROM (LEAST(b.end_time, $2::timestamp) - GREATEST(b.start_time, $1::timestamp))) / 3600) 
             / ((DATE_PART('day', $2::timestamp - $1::timestamp) + 1) * 9)) * 100 AS utilization_percentage
          FROM rooms r
          LEFT JOIN bookings b
            ON b.room_id = r.room_id
            AND b.status != 'cancelled'
            AND b.start_time <= $2::timestamp
            AND b.end_time >= $1::timestamp
          GROUP BY r.room_id, r.room_name
          ORDER BY r.room_name;
        `;
      } else {
        // group_by = 'time' -> group by day
        reportQuery = `
          SELECT
            DATE(b.start_time) AS day,
            COUNT(b.booking_id) AS total_bookings,
            SUM(EXTRACT(EPOCH FROM (LEAST(b.end_time, $2::timestamp) - GREATEST(b.start_time, $1::timestamp))) / 3600) AS total_duration_hours,
            (SUM(EXTRACT(EPOCH FROM (LEAST(b.end_time, $2::timestamp) - GREATEST(b.start_time, $1::timestamp))) / 3600) 
             / (COUNT(DISTINCT b.room_id) * 9)) * 100 AS utilization_percentage
          FROM bookings b
          WHERE b.status != 'cancelled'
            AND b.start_time <= $2::timestamp
            AND b.end_time >= $1::timestamp
          GROUP BY DATE(b.start_time)
          ORDER BY DATE(b.start_time);
        `;
      }
  
      const res = await client.query(reportQuery, values);
  
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          success: true,
          group_by,
          start_date,
          end_date,
          data: res.rows,
        }),
      };
    } catch (err) {
      console.error('❌ Utilization report error:', err);
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
  