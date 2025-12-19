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
import axiosLambda from "../../../axiosConfig/axiosLambda";
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
    <Box
      id="rooms-list-container"
      data-testid="rooms-list-container"
      sx={{ position: "relative", pb: 8 }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2 }}
        id="rooms-list-title"
        data-testid="rooms-list-title"
      >
        Available Rooms
      </Typography>

      {loading && (
        <Box
          sx={{ textAlign: "center", mt: 3 }}
          id="rooms-loading"
          data-testid="rooms-loading"
        >
          <CircularProgress
            id="rooms-loading-spinner"
            data-testid="rooms-loading-spinner"
          />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          id="rooms-error"
          data-testid="rooms-error"
        >
          {error}
        </Alert>
      )}

      {/* Rooms List */}
      {!loading && !error && rooms.length > 0 &&
        rooms.map((room) => (
          <Box
            key={room.room_id}
            id={`room-card-wrapper-${room.room_id}`}
            data-testid={`room-card-wrapper-${room.room_id}`}
          >
            <RoomCard
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
          </Box>
        ))}

      {!loading && !error && rooms.length === 0 && (
        <Typography
          id="rooms-empty"
          data-testid="rooms-empty"
        >
          No rooms found.
        </Typography>
      )}

      {/* Floating Add Button */}
      <Fab
        id="room-add-floating-button"
        data-testid="room-add-floating-button"
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Add Room Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        id="add-room-dialog"
        data-testid="add-room-dialog"
      >
        <DialogTitle
          id="add-room-dialog-title"
          data-testid="add-room-dialog-title"
        >
          Add New Room
        </DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          id="add-room-dialog-content"
          data-testid="add-room-dialog-content"
        >
          <TextField
            label="Room Name"
            name="room_name"
            value={newRoom.room_name}
            onChange={handleInputChange}
            fullWidth
            id="add-room-name"
            data-testid="add-room-name"
          />

          <TextField
            label="Description"
            name="description"
            value={newRoom.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={3}
            id="add-room-description"
            data-testid="add-room-description"
          />

          <TextField
            label="Capacity"
            name="capacity"
            type="number"
            value={newRoom.capacity}
            onChange={handleInputChange}
            fullWidth
            id="add-room-capacity"
            data-testid="add-room-capacity"
          />

          <TextField
            label="Location (e.g. G, 1, 2)"
            name="location"
            value={newRoom.location}
            onChange={handleInputChange}
            fullWidth
            id="add-room-location"
            data-testid="add-room-location"
          />

          <TextField
            label="Equipments (comma separated)"
            name="equipments"
            value={newRoom.equipments}
            onChange={handleInputChange}
            fullWidth
            id="add-room-equipments"
            data-testid="add-room-equipments"
          />
        </DialogContent>

        <DialogActions
          id="add-room-dialog-actions"
          data-testid="add-room-dialog-actions"
        >
          <Button
            onClick={() => setDialogOpen(false)}
            id="add-room-cancel"
            data-testid="add-room-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddRoom}
            variant="contained"
            id="add-room-confirm"
            data-testid="add-room-confirm"
          >
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
        id="rooms-snackbar"
        data-testid="rooms-snackbar"
      />
    </Box>
  );

};

export default RoomsList;
