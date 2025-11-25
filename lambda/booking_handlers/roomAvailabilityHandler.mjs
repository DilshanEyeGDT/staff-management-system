// booking_handlers/roomAvailabilityHandler.mjs

export const handleRoomAvailability = async (client, event) => {
    const query = event.queryStringParameters || {};
    const roomId = query.room_id;
    const startDateStr = query.start;
    const endDateStr = query.end;
  
    try {
      if (!roomId) {
        // --- Case 1: Return all rooms ---
        const roomsRes = await client.query(
          `SELECT room_id, room_name, description, capacity, location, equipments FROM rooms WHERE is_active = TRUE ORDER BY room_name`
        );
  
        return {
          statusCode: 200,
          headers: corsHeaders(),
          body: JSON.stringify({
            rooms: roomsRes.rows,
          }),
        };
      }
  
      // --- Case 2 & 3: Specific room timeline ---
      const roomRes = await client.query(
        `SELECT room_id, room_name FROM rooms WHERE room_id = $1`,
        [roomId]
      );
  
      if (roomRes.rows.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders(),
          body: JSON.stringify({ error: "Room not found" }),
        };
      }
  
      const room = roomRes.rows[0];
  
      // Default start/end to today if not provided
      let startDate = startDateStr ? new Date(startDateStr) : new Date();
      let endDate = endDateStr ? new Date(endDateStr) : new Date(startDate);
  
      endDate.setHours(23, 59, 59, 999);
  
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          statusCode: 400,
          headers: corsHeaders(),
          body: JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD." }),
        };
      }
  
      if (startDate > endDate) {
        return {
          statusCode: 400,
          headers: corsHeaders(),
          body: JSON.stringify({ error: "start date must be before end date" }),
        };
      }
  
      // --- Fetch busy slots ---
      const busyQuery = `
        SELECT start_time, end_time
        FROM bookings
        WHERE room_id = $1
          AND status = 'approved'
          AND start_time::date <= $3::date
          AND end_time::date >= $2::date
        UNION ALL
        SELECT start_time, end_time
        FROM blackout_windows
        WHERE room_id = $1
          AND start_time::date <= $3::date
          AND end_time::date >= $2::date
        ORDER BY start_time;
      `;
  
      const busyRes = await client.query(busyQuery, [roomId, startDateStr || startDate.toISOString().split('T')[0], endDateStr || endDate.toISOString().split('T')[0]]);
  
      // --- Build timeline ---
      const timeline = [];
      let current = new Date(startDate);
  
      for (const slot of busyRes.rows) {
        const busyStart = new Date(slot.start_time);
        const busyEnd = new Date(slot.end_time);
  
        // Free slot before busy
        if (current < busyStart) {
          timeline.push({
            start_time: current.toISOString(),
            end_time: busyStart.toISOString(),
            status: "free",
          });
        }
  
        // Busy slot
        timeline.push({
          start_time: busyStart.toISOString(),
          end_time: busyEnd.toISOString(),
          status: "busy",
        });
  
        current = busyEnd > current ? busyEnd : current;
      }
  
      // Last free slot
      if (current < endDate) {
        timeline.push({
          start_time: current.toISOString(),
          end_time: endDate.toISOString(),
          status: "free",
        });
      }
  
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          room_id: room.room_id,
          room_name: room.room_name,
          timeline,
        }),
      };
    } catch (error) {
      console.error("❌ Room availability error:", error);
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({ success: false, error: "Internal server error" }),
      };
    }
  };
  
  // --- CORS headers ---
  const corsHeaders = () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  