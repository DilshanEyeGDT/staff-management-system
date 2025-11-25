// booking_handlers/deleteBookingHandler.mjs

/**
 * Exports:
 *  - handleDeleteBooking(client, event)
 *
 * Behavior:
 *  - DELETE /api/v1/bookings?booking_id=<id>
 *
 * This performs a soft-cancel:
 *  - sets status = 'cancelled'
 *  - updates updated_at = NOW()
 *  - inserts a booking_audit row with action = 'cancelled'
 */

export async function handleDeleteBooking(client, event) {
  const q = event.queryStringParameters || {};
  const booking_id = q.booking_id;

  if (!booking_id) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, message: 'Missing required query parameter: booking_id' }),
    };
  }

  // Parse user_id from body if sent, otherwise fallback to currentUser
  let user_id = null;
  if (event.body) {
    try {
      const body = JSON.parse(event.body);
      user_id = body.user_id || event.currentUser?.user_id || null;
    } catch (e) {
      console.warn('⚠️ Could not parse request body for user_id', e);
      user_id = event.currentUser?.user_id || null;
    }
  } else {
    user_id = event.currentUser?.user_id || null;
  }

  if (!user_id) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, message: 'Missing user_id to record in audit.' }),
    };
  }

  try {
    await client.query('BEGIN');

    // Check booking exists
    const bookingRes = await client.query(
      `SELECT booking_id, status FROM bookings WHERE booking_id = $1 LIMIT 1;`,
      [booking_id]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, message: 'Booking not found.' }),
      };
    }

    const currentStatus = bookingRes.rows[0].status;
    if (currentStatus === 'cancelled') {
      // already cancelled - idempotent behaviour: return success
      await client.query('COMMIT');
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ success: true, message: 'Booking already cancelled.' }),
      };
    }

    // Update booking status to cancelled
    await client.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE booking_id = $1;`,
      [booking_id]
    );

    // Insert booking_audit
    await client.query(
      `INSERT INTO booking_audit (booking_id, action, performed_by_user_id) VALUES ($1, 'cancelled', $2);`,
      [booking_id, user_id]
    );

    await client.query('COMMIT');

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ success: true, message: 'Booking cancelled successfully.' }),
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      console.error('❌ Error during rollback:', e);
    }
    console.error('❌ DELETE booking error:', err);
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
