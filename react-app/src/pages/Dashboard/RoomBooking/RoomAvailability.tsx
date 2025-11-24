import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
  TextField,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axiosLambda from "../../../axiosLambda";

interface TimelineItem {
  start_time: string;
  end_time: string;
  status: string; // "free" or "booked"
}

const RoomAvailability: React.FC = () => {
  const { room_id } = useParams();
  const [roomName, setRoomName] = useState("");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  // Booking state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error">("success");

  const showSnackbar = (msg: string, severity: "success" | "error") => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchUser = () => {
    axiosLambda
      .get("/api/v1/users/me")
      .then((res) => setUserId(res.data.user.user_id))
      .catch(() => showSnackbar("Failed to fetch user", "error"));
  };

  const fetchAvailability = () => {
    setLoading(true);
    axiosLambda
      .get(`/api/v1/rooms/availability?room_id=${room_id}&start=2025-11-21&end=2025-11-21`)
      .then((res) => {
        setRoomName(res.data.room_name);
        setTimeline(res.data.timeline || []);
      })
      .catch((err) => {
        setError("Failed to load room availability");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAvailability();
    fetchUser();
  }, []);

  const handleBooking = () => {
    if (!userId) {
      showSnackbar("Cannot identify user", "error");
      return;
    }

    const payload = {
      room_id: Number(room_id),
      user_id: userId,
      start_time: startTime,
      end_time: endTime,
    };

    axiosLambda
      .post("/api/v1/bookings", payload)
      .then(() => {
        showSnackbar("Booking created successfully!", "success");
        fetchAvailability();

        setTimeout(() => {
        navigate("/dashboard");   // ✅ redirect after success
    }, 1500);
      })
      .catch((err) => {
        showSnackbar("Booking failed: " + err?.response?.data?.message, "error");
      });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Room Availability - {roomName}
      </Typography>

      {loading && (
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {/* Timeline */}
      {timeline.map((t, i) => (
        <Box
          key={i}
          sx={{
            p: 2,
            mt: 2,
            borderRadius: 2,
            background: t.status === "free" ? "#d4ffd4" : "#ffd4d4",
          }}
        >
          <Typography>Status: {t.status}</Typography>
          <Typography>
            {new Date(t.start_time).toLocaleString()} →{" "}
            {new Date(t.end_time).toLocaleString()}
          </Typography>
        </Box>
      ))}

      {/* If free → show booking form */}
      {timeline.some((t) => t.status === "free") && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Book This Room</Typography>

          <TextField
            fullWidth
            label="Start Time"
            type="datetime-local"
            sx={{ mt: 2 }}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="End Time"
            type="datetime-local"
            sx={{ mt: 2 }}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleBooking}
          >
            Book Room
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={4000}
      />
    </Box>
  );
};

export default RoomAvailability;
