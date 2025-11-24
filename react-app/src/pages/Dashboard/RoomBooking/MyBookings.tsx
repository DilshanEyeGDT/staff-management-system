// src/pages/MyBookings.tsx
import React, { useEffect, useState } from "react";
import axiosLambda from "../../../axiosLambda";
import { Snackbar, Alert } from "@mui/material";

interface Booking {
  booking_id: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  room_name: string;
}

interface CurrentUser {
  user_id: number;
  display_name: string;
}

const MyBookings: React.FC = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const res = await axiosLambda.get("/api/v1/users/me");
      setUser(res.data.user);
      return res.data.user.user_id;
    } catch {
      setError("Failed to load user information.");
      setLoading(false);
      return null;
    }
  };

  // Fetch current user's bookings
  const fetchBookings = async (uid: number) => {
    try {
      const res = await axiosLambda.get(`/api/v1/bookings?user_id=${uid}`);
      setBookings(res.data.data);
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel Booking
const cancelBooking = async (booking_id: string) => {
  if (!user) {
    showSnackbar("User not loaded.", "error");
    return;
  }

  try {
    await axiosLambda.delete(`/api/v1/bookings?booking_id=${booking_id}`, {
      data: { user_id: user.user_id }, // << REQUIRED BODY
    });

    // Remove cancelled booking from UI
    setBookings((prev) =>
      prev.filter((b) => b.booking_id !== booking_id)
    );

    showSnackbar("Booking cancelled successfully.", "success");
  } catch (err) {
    showSnackbar("Failed to cancel booking.", "error");
  }
};

  useEffect(() => {
    const load = async () => {
      const uid = await fetchCurrentUser();
      if (uid) await fetchBookings(uid);
    };
    load();
  }, []);

  return (
  <div id="my-bookings-page" style={{ padding: "20px" }}>

    {/* Loading */}
    {loading && <p id="my-bookings-loading">Loading your bookings...</p>}

    {/* Error */}
    {error && <p id="my-bookings-error" style={{ color: "red" }}>{error}</p>}

    {/* Empty State */}
    {!loading && bookings.length === 0 && (
      <p id="my-bookings-empty">You have no bookings yet.</p>
    )}

    {/* Booking List */}
    {!loading &&
      bookings.length > 0 &&
      bookings.map((b) => (
        <div
          key={b.booking_id}
          id={`booking-card-${b.booking_id}`}
          style={{
            border: "1px solid #ccc",
            padding: "16px",
            marginBottom: "16px",
            borderRadius: "10px",
          }}
        >
          <h3 id={`booking-room-name-${b.booking_id}`}>{b.room_name}</h3>

          <p>
            <strong>Status:</strong>{" "}
            <span
              id={`booking-status-${b.booking_id}`}
              style={{
                color:
                  b.status === "approved"
                    ? "green"
                    : b.status === "cancelled"
                    ? "red"
                    : "orange",
              }}
            >
              {b.status}
            </span>
          </p>

          <p>
            <strong>Start:</strong>{" "}
            <span id={`booking-start-${b.booking_id}`}>
              {new Date(b.start_time).toLocaleString()}
            </span>
          </p>

          <p>
            <strong>End:</strong>{" "}
            <span id={`booking-end-${b.booking_id}`}>
              {new Date(b.end_time).toLocaleString()}
            </span>
          </p>

          {/* Cancel Button */}
          {b.status !== "cancelled" && (
            <button
              id={`booking-cancel-btn-${b.booking_id}`}
              onClick={() => cancelBooking(b.booking_id)}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                background: "#d32f2f",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel Booking
            </button>
          )}
        </div>
      ))}

    {/* Snackbar */}
    <Snackbar
      id="my-bookings-snackbar"
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        id="my-bookings-snackbar-alert"
        onClose={handleCloseSnackbar}
        severity={snackbar.severity}
        variant="filled"
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </div>
);

};

export default MyBookings;
