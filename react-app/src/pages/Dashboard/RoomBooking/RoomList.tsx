import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fab,
  Snackbar,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import axiosLambda from "../../../axiosLambda";
import RoomCard from "./RoomCard";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_name: "",
    description: "",
    capacity: 0,
    location: "",
    equipments: "",
  });

  // Fetch all rooms
  const fetchRooms = () => {
    setLoading(true);
    axiosLambda
      .get("/api/v1/rooms?page=1&size=50")
      .then((res) => {
        setRooms(res.data.rooms || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load rooms");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Handle snackbar
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Handle dialog input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoom((prev) => ({ ...prev, [name]: value }));
  };

  // Submit new room
  const handleAddRoom = () => {
    // Prepare payload
    const payload = {
      room_name: newRoom.room_name,
      description: newRoom.description,
      capacity: Number(newRoom.capacity),
      location: newRoom.location,
      equipments: newRoom.equipments.split(",").map((eq) => eq.trim()),
    };

    axiosLambda
      .post("/api/v1/rooms", payload)
      .then((res) => {
        setSnackbarMsg("Room added successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setDialogOpen(false);
        setNewRoom({ room_name: "", description: "", capacity: 0, location: "", equipments: "" });
        fetchRooms();
      })
      .catch((err) => {
        setSnackbarMsg(err?.response?.data?.message || "Failed to add room");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  };

  return (
    <Box id="rooms-list-container" sx={{ position: "relative", pb: 8 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Available Rooms
      </Typography>

      {loading && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Rooms List */}
      {!loading && !error && rooms.length > 0 &&
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
            onClick={() => navigate(`/rooms/${room.room_id}`)}
          />
        ))}

      {!loading && !error && rooms.length === 0 && (
        <Typography>No rooms found.</Typography>
      )}

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Add Room Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Room Name"
            name="room_name"
            value={newRoom.room_name}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Description"
            name="description"
            value={newRoom.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Capacity"
            name="capacity"
            type="number"
            value={newRoom.capacity}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Location (e.g. G, 1, 2)"
            name="location"
            value={newRoom.location}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Equipments (comma separated)"
            name="equipments"
            value={newRoom.equipments}
            onChange={handleInputChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddRoom} variant="contained">
            Add Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default RoomsList;
