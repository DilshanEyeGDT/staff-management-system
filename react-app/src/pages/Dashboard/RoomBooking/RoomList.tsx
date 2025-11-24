import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import axiosLambda from "../../../axiosLambda"; // <-- UPDATE THIS PATH if needed
import RoomCard from "./RoomCard";

interface Room {
  room_id: number;
  room_name: string;
  description: string;
  capacity: number;
  location: string;
  equipments: string[];
  is_active: boolean;
  created_at: string;
}

const RoomsList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all rooms
  useEffect(() => {
    setLoading(true);

    axiosLambda
      .get("/api/v1/rooms?page=1&size=50") // optional pagination
      .then((res) => {
        setRooms(res.data.rooms || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load rooms");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box id="rooms-list-container">
      <Typography variant="h6" sx={{ mb: 2 }}>
        Available Rooms
      </Typography>

      {/* Loading Spinner */}
      {loading && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Rooms List */}
      {!loading &&
        !error &&
        rooms.map((room) => (
          <RoomCard
            key={room.room_id}
            room_id={room.room_id}
            room_name={room.room_name}
            description={room.description}
            capacity={room.capacity}
            location={room.location}
            equipments={room.equipments}
            is_active={room.is_active}
            created_at={room.created_at}
        />
        ))}

      {/* Empty State */}
      {!loading && !error && rooms.length === 0 && (
        <Typography>No rooms found.</Typography>
      )}
    </Box>
  );
};

export default RoomsList;
