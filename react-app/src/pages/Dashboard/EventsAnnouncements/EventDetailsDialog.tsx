import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import axiosGo from "../../../axiosConfig/axiosGo";
import dayjs from "dayjs";
import EditEventDialog from "./EditEventDialog";

interface Props {
  open: boolean;
  eventId: number | null;
  onClose: () => void;
  onUpdated: () => void;  // Inform EventsTab
}

const EventDetailsDialog: React.FC<Props> = ({ open, eventId, onClose, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  const [editOpen, setEditOpen] = useState(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnack({ open: true, message, severity });
  };

  const fetchEventDetails = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const res = await axiosGo.get(`/events/${eventId}`);
      setDetails(res.data);
    } catch (err) {
      console.error("Failed to load event details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchEventDetails();
  }, [open]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Event Details</DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : !details ? (
            <Typography>No data found</Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="h6">{details.event.title}</Typography>
                <Typography>{details.event.summary}</Typography>

                <Typography variant="caption" color="text.secondary">
                  Scheduled: {dayjs(details.event.scheduled_at).format("YYYY-MM-DD HH:mm")}
                </Typography>

                <Divider />

                <Typography variant="subtitle1">Announcement</Typography>
                <Typography>{details.announcement.content}</Typography>

                <Divider />

                <Typography variant="subtitle1">Tags</Typography>
                {details.tags.map((t: any) => (
                  <Chip key={t.id} label={t.tag} sx={{ mr: 1, mt: 1 }} />
                ))}

                <Divider />

                <Typography variant="subtitle1">Audit Logs</Typography>
                {details.publish_audit.map((log: any) => (
                  <Box key={log.id} sx={{ mb: 1 }}>
                    <Typography><strong>Action:</strong> {log.action}</Typography>
                    <Typography><strong>Channel:</strong> {log.channel}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(log.performed_at).format("YYYY-MM-DD HH:mm:ss")}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {details?.event.status === "draft" && (
            <Button
              variant="outlined"
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
          )}

          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Event Modal */}
      <EditEventDialog
        open={editOpen}
        eventId={eventId}
        initialData={details}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          onUpdated();        // refresh events tab
          fetchEventDetails(); // refresh this dialog
        }}
        showSnackbar={showSnackbar}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
};

export default EventDetailsDialog;
