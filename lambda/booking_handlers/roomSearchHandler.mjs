// booking_handlers/roomSearchHandler.mjs

export const handleRoomSearch = async (client, event) => {
    const query = event?.queryStringParameters || {};
  
    const date = query.date || null;
    const capacity = query.capacity ? parseInt(query.capacity, 10) : null;
  
    // equipments passed as "projector,tv,whiteboard"
    const equipmentList =
      query.equipments && query.equipments.trim().length > 0
        ? query.equipments.split(",").map((e) => e.trim())
        : null;
  
    // Pagination
    const page = query.page ? parseInt(query.page, 10) : 1;
    const size = query.size ? parseInt(query.size, 10) : 10;
  
    const limit = size;
    const offset = (page - 1) * size;
  
    // --- Validate Input ---
    if (date && isNaN(Date.parse(date))) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Invalid date format. Use ISO date string." }),
      };
    }
  
    try {
      const sqlQuery = `
        SELECT *
        FROM rooms r
        WHERE r.is_active = TRUE
          AND ($1::INT IS NULL OR r.capacity >= $1)
          AND (
              $2::VARCHAR[] IS NULL 
              OR r.equipments @> $2
          )
          AND (
              $3::DATE IS NULL
              OR NOT EXISTS (
                  SELECT 1 FROM bookings b
                  WHERE b.room_id = r.room_id
                    AND b.status = 'approved'
                    AND $3::TIMESTAMP BETWEEN b.start_time AND b.end_time
              )
          )
          AND (
              $3::DATE IS NULL
              OR NOT EXISTS (
                  SELECT 1 FROM blackout_windows bw
                  WHERE bw.room_id = r.room_id
                    AND $3::TIMESTAMP BETWEEN bw.start_time AND bw.end_time
              )
          )
        ORDER BY r.room_name
        LIMIT $4 OFFSET $5;
      `;
  
      const values = [
        capacity,        // $1
        equipmentList,   // $2
        date,            // $3
        limit,           // $4
        offset           // $5
      ];
  
      const result = await client.query(sqlQuery, values);
  
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({
          page,
          size,
          total: result.rowCount,
          rooms: result.rows,
        }),
      };
    } catch (error) {
      console.error("❌ Room search error:", error);
  
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({
          success: false,
          error: "Internal server error while searching rooms",
        }),
      };
    }
  };
  
  // --- Reusable CORS headers like your existing handlers ---
  const corsHeaders = () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  