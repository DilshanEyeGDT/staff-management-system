import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import axiosGo from "../../../axiosConfig/axiosGo";
import axios from "../../../axiosConfig/axiosConfig"; // for /me endpoint

interface Event {
  id: number;
  title: string;
  summary: string;
  body_id: number;
  created_by: number;
  created_by_name: string;
  status: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  sent?: boolean; // optional flag to track sent events
}

const ApprovedEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const fetchApprovedEvents = async () => {
    setLoading(true);
    try {
      const res = await axiosGo.get("/events");
      const approvedEvents = res.data
        .filter((event: Event) => event.status === "approved")
        .map((event: Event) => ({ ...event, sent: false })); // add sent flag
      setEvents(approvedEvents);
    } catch (err) {
      setError("Failed to fetch approved events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedEvents();
  }, []);

  const getCurrentUserId = async (): Promise<number> => {
    try {
      const res = await axios.get("/me");
      return res.data.id;
    } catch (err) {
      throw new Error("Failed to fetch current user ID");
    }
  };

  const handleSend = async (eventId: number) => {
    try {
      const userId = await getCurrentUserId();
      await axiosGo.post(`/events/${eventId}/broadcast`, {
        performed_by: userId,
      });

      // mark event as sent
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, sent: true } : e))
      );

      // show snackbar
      setSnackbar({ open: true, message: "Event sent successfully!", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to send event.", severity: "error" });
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  if (events.length === 0)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Typography>No approved events found.</Typography>
      </Box>
    );

  return (
  <Box
    sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
    data-testid="send-events-container"
  >
    {events.map((event) => (
      <Paper
        key={event.id}
        sx={{ p: 2 }}
        data-testid={`send-event-card-${event.id}`}
      >
        <List>
          <ListItem
            data-testid={`send-event-list-item-${event.id}`}
            secondaryAction={
              <Button
                variant="contained"
                color="primary"
                disabled={event.sent}
                onClick={() => handleSend(event.id)}
                data-testid={`send-event-button-${event.id}`}
              >
                {event.sent ? "Sent" : "Send"}
              </Button>
            }
          >
            <ListItemText
              primary={
                <Typography
                  data-testid={`send-event-title-${event.id}`}
                >
                  {event.title}
                </Typography>
              }
              secondary={
                <>
                  <Typography
                    variant="body2"
                    data-testid={`send-event-summary-${event.id}`}
                  >
                    {event.summary}
                  </Typography>
                  <Typography
                    variant="caption"
                    data-testid={`send-event-meta-${event.id}`}
                  >
                    Scheduled: {new Date(event.scheduled_at).toLocaleString()} | Created by:{" "}
                    {event.created_by_name}
                  </Typography>
                </>
              }
            />
          </ListItem>
        </List>
      </Paper>
    ))}

    {/* Snackbar */}
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={() => setSnackbar({ ...snackbar, open: false })}
      data-testid="send-events-snackbar"
    >
      <Alert
        severity={snackbar.severity}
        data-testid="send-events-snackbar-alert"
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </Box>
);

};

export default ApprovedEvents;
