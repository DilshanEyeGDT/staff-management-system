// booking_handlers/createRoomHandler.mjs

export const handleRoomCreate = async (client, event) => {
    let body = {};
  
    try {
      if (event.body) {
        body = JSON.parse(event.body);
      }
    } catch (err) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }
  
    const { room_name, description, capacity, location, equipments } = body;
  
    // --- Basic validation ---
    if (!room_name || !capacity) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: "Missing required fields: room_name, capacity",
        }),
      };
    }
  
    if (equipments && !Array.isArray(equipments)) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: "equipments must be an array of strings",
        }),
      };
    }
  
    try {
      // --- Prevent duplicate room names ---
      const dupCheck = await client.query(
        `SELECT room_id FROM rooms WHERE LOWER(room_name) = LOWER($1) LIMIT 1`,
        [room_name]
      );
  
      if (dupCheck.rows.length > 0) {
        return {
          statusCode: 409,
          headers: corsHeaders(),
          body: JSON.stringify({
            error: "A room with this name already exists",
          }),
        };
      }
  
      // --- Insert new room ---
      const insertQuery = `
        INSERT INTO rooms (room_name, description, capacity, location, equipments)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING room_id, room_name, description, capacity, location, equipments;
      `;
  
      const values = [
        room_name,
        description || null,
        capacity,
        location || null,
        equipments || [],
      ];
  
      const result = await client.query(insertQuery, values);
      const createdRoom = result.rows[0];
  
      return {
        statusCode: 201,
        headers: corsHeaders(),
        body: JSON.stringify({
          success: true,
          message: "Room created successfully",
          room: createdRoom,
        }),
      };
    } catch (error) {
      console.error("❌ Room creation error:", error);
  
      return {
        statusCode: 500,
        headers: corsHeaders(),
        body: JSON.stringify({
          success: false,
          error: "Internal server error while creating room",
        }),
      };
    }
  };
  
  // --- CORS headers ---
  const corsHeaders = () => ({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  