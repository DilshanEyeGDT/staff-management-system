// booking_handlers/exportBookingsICSHandler.mjs
import { format } from 'date-fns-tz';

/**
 * Exports:
 *   - handleExportBookingsICS(client, event)
 *
 * Query Params:
 *   - start_date: ISO string
 *   - end_date: ISO string
 *
 * Generates ICS file for bookings in the given range (approved + cancelled)
 */
export async function handleExportBookingsICS(client, event) {
  const q = event.queryStringParameters || {};
  const start_date = q.start_date;
  const end_date = q.end_date;

  if (!start_date || !end_date) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, message: 'Missing start_date or end_date query parameters.' }),
    };
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, message: 'Invalid date range.' }),
    };
  }

  try {
    const bookingsQuery = `
      SELECT b.booking_id, b.start_time, b.end_time, b.status, 
             r.room_name, u.full_name AS user_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.start_time::date >= $1::date AND b.end_time::date <= $2::date
        AND b.status IN ('approved', 'cancelled')
      ORDER BY b.start_time;
    `;
    const res = await client.query(bookingsQuery, [start.toISOString(), end.toISOString()]);
    const bookings = res.rows;

    // ICS header
    let icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YourApp//Bookings ICS Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    bookings.forEach(b => {
      const startLocal = format(new Date(b.start_time), "yyyyMMdd'T'HHmmss");
      const endLocal = format(new Date(b.end_time), "yyyyMMdd'T'HHmmss");

      icsData.push(
        'BEGIN:VEVENT',
        `UID:${b.booking_id}`,
        `SUMMARY:Booking - ${b.room_name}`,
        `DESCRIPTION:Booked by ${b.user_name}\\nStatus: ${b.status}`,
        `DTSTART;TZID=Asia/Colombo:${startLocal}`,
        `DTEND;TZID=Asia/Colombo:${endLocal}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsData.push('END:VCALENDAR');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': 'attachment; filename="bookings.ics"',
      },
      body: icsData.join('\r\n'),
    };
  } catch (err) {
    console.error('❌ Export bookings ICS error:', err);
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
