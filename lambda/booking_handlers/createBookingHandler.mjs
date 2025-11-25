// booking_handlers/createBookingHandler.mjs

import crypto from 'crypto';

/**
 * Expected body:
 * {
 *   "room_id": 1,
 *   "user_id": 123,                 // optional if middleware sets event.currentUser
 *   "start_time": "2025-11-21T09:00:00",
 *   "end_time": "2025-11-21T10:00:00",
 *   "idempotency_key": "optional-unique-key"
 * }
 */
export async function handleCreateBooking(client, event) {
  const body = JSON.parse(event.body || '{}');
  const { room_id, start_time, end_time } = body;
  // accept idempotency_key from body; if not present generate one
  const idempotencyKeyFromBody = body.idempotency_key;
  const idempotency_key = idempotencyKeyFromBody && String(idempotencyKeyFromBody).trim().slice(0, 100)
    ? String(idempotencyKeyFromBody).trim().slice(0, 100)
    : crypto.randomUUID();

  // prefer user_id from body, fallback to middleware injected event.currentUser
  const user_id = body.user_id || event.currentUser?.user_id;

  // Basic validation
  if (!room_id || !user_id || !start_time || !end_time) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, message: 'Missing required fields: room_id, start_time, end_time, or user_id' }),
    };
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ success: false, message: 'Invalid start_time or end_time (ensure ISO timestamp and start < end).' }),
    };
  }

  try {
    // Begin transaction
    await client.query('BEGIN');

    // 1) Idempotency check: if a booking exists with this idempotency_key, return it
    const idempRes = await client.query(
      `SELECT booking_id, room_id, user_id, start_time, end_time, status, idempotency_key, created_at, updated_at
       FROM bookings WHERE idempotency_key = $1 LIMIT 1`,
      [idempotency_key]
    );

    if (idempRes.rows.length > 0) {
      // Found an existing booking for this idempotency key — return it (200)
      await client.query('COMMIT');
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          success: true,
          message: 'Idempotent request: booking already exists.',
          data: idempRes.rows[0],
        }),
      };
    }

    // 2) Lock the room row to reduce race conditions
    // (locks the specific room row until transaction completes)
    const lockRoomRes = await client.query(
      `SELECT room_id FROM rooms WHERE room_id = $1 FOR UPDATE`,
      [room_id]
    );

    if (lockRoomRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 404,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, message: 'Room not found' }),
      };
    }

    // 3) Conflict check: bookings (pending OR approved) that overlap, and blackout windows
    // Overlap condition: NOT (existing.end_time <= new.start_time OR existing.start_time >= new.end_time)
    const conflictQuery = `
      SELECT 1 FROM bookings
      WHERE room_id = $1
        AND status = 'approved'
        AND NOT (end_time <= $2 OR start_time >= $3)
      LIMIT 1;
    `;
    const conflictRes = await client.query(conflictQuery, [room_id, start.toISOString(), end.toISOString()]);

    if (conflictRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 409,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, message: 'Booking conflict detected with an existing booking.' }),
      };
    }

    // Check blackout windows overlap
    const blackoutQuery = `
      SELECT 1 FROM blackout_windows
      WHERE room_id = $1
        AND NOT (end_time <= $2 OR start_time >= $3)
      LIMIT 1;
    `;
    const blackoutRes = await client.query(blackoutQuery, [room_id, start.toISOString(), end.toISOString()]);

    if (blackoutRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        statusCode: 409,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, message: 'Booking conflicts with a blackout window.' }),
      };
    }

    // 4) Insert booking (status = approved now)
    const insertQuery = `
      INSERT INTO bookings (room_id, user_id, start_time, end_time, status, idempotency_key, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'approved', $5, NOW(), NOW())
      RETURNING booking_id, room_id, user_id, start_time, end_time, status, idempotency_key, created_at, updated_at;
    `;
    const insertRes = await client.query(insertQuery, [room_id, user_id, start.toISOString(), end.toISOString(), idempotency_key]);
    const newBooking = insertRes.rows[0];

    // 5) Insert booking_audit entry
    await client.query(
      `INSERT INTO booking_audit (booking_id, action, performed_by_user_id) VALUES ($1, 'approved', $2)`,
      [newBooking.booking_id, user_id]
    );

    await client.query('COMMIT');

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({
        success: true,
        message: 'Booking created successfully.',
        data: newBooking,
      }),
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      console.error('❌ Error during rollback:', e);
    }

    console.error('❌ POST create booking error:', err);
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
