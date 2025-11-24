import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import axiosLambda from "../../../axiosLambda"; // adjust path if needed

interface Booking {
  booking_id: string;
  start_time: string;
  end_time: string;
  status: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  room_name: string;
}

const RoomBookingsList: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [userName, setUserName] = useState("");
  const [roomName, setRoomName] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosLambda.get("/api/v1/bookings");
      setBookings(res.data.data || []);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply filters
  const filteredBookings = bookings.filter((b) => {
    const startDateTime = new Date(b.start_time);
    const endDateTime = new Date(b.end_time);

    if (startDate && startDateTime < new Date(startDate)) return false;
    if (endDate && endDateTime > new Date(endDate)) return false;

    if (startTime) {
      const filterStart = new Date(`1970-01-01T${startTime}`);
      if (
        startDateTime.getHours() < filterStart.getHours() ||
        (startDateTime.getHours() === filterStart.getHours() &&
          startDateTime.getMinutes() < filterStart.getMinutes())
      )
        return false;
    }

    if (endTime) {
      const filterEnd = new Date(`1970-01-01T${endTime}`);
      if (
        endDateTime.getHours() > filterEnd.getHours() ||
        (endDateTime.getHours() === filterEnd.getHours() &&
          endDateTime.getMinutes() > filterEnd.getMinutes())
      )
        return false;
    }

    if (userName && !b.user_name.toLowerCase().includes(userName.toLowerCase()))
      return false;

    if (roomName && !b.room_name.toLowerCase().includes(roomName.toLowerCase()))
      return false;

    return true;
  });

  return (
  <Box id="all-room-bookings-page">
    <Typography id="all-room-bookings-title" variant="h6" sx={{ mb: 2 }}>
      Room Bookings
    </Typography>

    {/* Filters */}
    <Box id="bookings-filters" sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
      <TextField
        id="filter-start-date"
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        id="filter-end-date"
        label="End Date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        id="filter-start-time"
        label="Start Time"
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        id="filter-end-time"
        label="End Time"
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        id="filter-user-name"
        label="User Name"
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <TextField
        id="filter-room-name"
        label="Room Name"
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />
      <Button id="filter-refresh-btn" variant="contained" onClick={fetchBookings}>
        Refresh
      </Button>
    </Box>

    {/* Loading */}
    {loading && (
      <Box id="all-bookings-loading" sx={{ textAlign: "center", mt: 3 }}>
        <CircularProgress />
      </Box>
    )}

    {/* Error */}
    {error && (
      <Alert id="all-bookings-error" severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )}

    {/* Booking List */}
    {!loading && !error && filteredBookings.length > 0 ? (
      <Box id="bookings-list" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filteredBookings.map((b) => (
          <Paper id={`booking-card-${b.booking_id}`} key={b.booking_id} sx={{ p: 2 }}>
            <Typography id={`booking-room-${b.booking_id}`}>
              <strong>Room:</strong> {b.room_name}
            </Typography>
            <Typography id={`booking-user-${b.booking_id}`}>
              <strong>User:</strong> {b.user_name}
            </Typography>
            <Typography id={`booking-start-${b.booking_id}`}>
              <strong>Start:</strong> {new Date(b.start_time).toLocaleString()}
            </Typography>
            <Typography id={`booking-end-${b.booking_id}`}>
              <strong>End:</strong> {new Date(b.end_time).toLocaleString()}
            </Typography>
            <Typography id={`booking-status-${b.booking_id}`}>
              <strong>Status:</strong> {b.status}
            </Typography>
          </Paper>
        ))}
      </Box>
    ) : (
      !loading && <Typography id="bookings-empty">No bookings found.</Typography>
    )}
  </Box>
);

};

export default RoomBookingsList;
