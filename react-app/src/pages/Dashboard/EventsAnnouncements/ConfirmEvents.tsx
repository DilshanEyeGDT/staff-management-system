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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import axiosGo from "../../../axiosConfig/axiosGo";
import { getCurrentUserId, approveEvent, rejectEvent } from "./eventModeration";

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
}

const ConfirmEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  // Channel selection dialog state
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<"push" | "email">("push");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Fetch draft events
  const fetchDraftEvents = async () => {
    setLoading(true);
    try {
      const res = await axiosGo.get("/events");
      const draftEvents = res.data.filter((event: Event) => event.status === "draft");
      setEvents(draftEvents);
    } catch {
      setError("Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftEvents();
  }, []);

  const openChannelDialog = (eventId: number) => {
    setSelectedEventId(eventId);
    setSelectedChannel("push"); // default
    setChannelDialogOpen(true);
  };

  const handleChannelConfirm = async () => {
    if (selectedEventId === null) return;

    try {
      const userId = await getCurrentUserId();
      await approveEvent(selectedEventId, userId, selectedChannel);

      // Remove approved event locally
      setEvents((prev) => prev.filter((e) => e.id !== selectedEventId));

      // Show snackbar first
      setSnackbar({ open: true, message: "Event approved!", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to approve event.", severity: "error" });
    } finally {
      // Close the dialog in next tick to ensure snackbar renders
      setTimeout(() => {
        setChannelDialogOpen(false);
        setSelectedEventId(null);
      }, 100);
    }
  };

  const handleReject = async (eventId: number) => {
    try {
      const userId = await getCurrentUserId();
      await rejectEvent(eventId, userId);

      // Remove rejected event locally
      setEvents((prev) => prev.filter((e) => e.id !== eventId));

      // Show snackbar
      setSnackbar({ open: true, message: "Event rejected!", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to reject event.", severity: "error" });
    }
  };

  return (
    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {!loading && !error && events.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Typography>No draft events found.</Typography>
        </Box>
      )}

      {!loading &&
        !error &&
        events.map((event) => (
          <Paper key={event.id} sx={{ p: 2 }}>
            <List>
              <ListItem
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => openChannelDialog(event.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleReject(event.id)}
                    >
                      Reject
                    </Button>
                  </Box>
                }
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <>
                      <Typography variant="body2">{event.summary}</Typography>
                      <Typography variant="caption">
                        Scheduled: {new Date(event.scheduled_at).toLocaleString()} | Created
                        by: {event.created_by_name}
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
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Channel selection dialog */}
      <Dialog open={channelDialogOpen} onClose={() => setChannelDialogOpen(false)}>
        <DialogTitle>Select Channel</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value as "push" | "email")}
          >
            <FormControlLabel value="push" control={<Radio />} label="Push" />
            <FormControlLabel value="email" control={<Radio />} label="Email" />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChannelDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChannelConfirm}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfirmEvents;
