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
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        data-testid="event-details-dialog"
      >
        <DialogTitle data-testid="event-details-title">
          Event Details
        </DialogTitle>

        <DialogContent dividers data-testid="event-details-content">
          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 3 }}
              data-testid="event-details-loading"
            >
              <CircularProgress data-testid="event-details-loading-spinner" />
            </Box>
          ) : !details ? (
            <Typography data-testid="event-details-no-data">
              No data found
            </Typography>
          ) : (
            <>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                data-testid="event-details-body"
              >
                <Typography
                  variant="h6"
                  data-testid="event-details-event-title"
                >
                  {details.event.title}
                </Typography>

                <Typography data-testid="event-details-event-summary">
                  {details.event.summary}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  data-testid="event-details-event-scheduled"
                >
                  Scheduled:{" "}
                  {dayjs(details.event.scheduled_at).format(
                    "YYYY-MM-DD HH:mm"
                  )}
                </Typography>

                <Divider data-testid="event-details-divider-1" />

                <Typography
                  variant="subtitle1"
                  data-testid="event-details-announcement-title"
                >
                  Announcement
                </Typography>

                <Typography data-testid="event-details-announcement-content">
                  {details.announcement.content}
                </Typography>

                <Divider data-testid="event-details-divider-2" />

                <Typography
                  variant="subtitle1"
                  data-testid="event-details-tags-title"
                >
                  Tags
                </Typography>

                <Box data-testid="event-details-tags-container">
                  {details.tags.map((t: any, index: number) => (
                    <Chip
                      key={t.id}
                      label={t.tag}
                      sx={{ mr: 1, mt: 1 }}
                      data-testid={`event-details-tag-${index}`}
                    />
                  ))}
                </Box>

                <Divider data-testid="event-details-divider-3" />

                <Typography
                  variant="subtitle1"
                  data-testid="event-details-audit-title"
                >
                  Audit Logs
                </Typography>

                <Box data-testid="event-details-audit-container">
                  {details.publish_audit.map((log: any, index: number) => (
                    <Box
                      key={log.id}
                      sx={{ mb: 1 }}
                      data-testid={`event-details-audit-${index}`}
                    >
                      <Typography data-testid={`event-details-audit-action-${index}`}>
                        <strong>Action:</strong> {log.action}
                      </Typography>

                      <Typography data-testid={`event-details-audit-channel-${index}`}>
                        <strong>Channel:</strong> {log.channel}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        data-testid={`event-details-audit-time-${index}`}
                      >
                        {dayjs(log.performed_at).format(
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      </Typography>

                      <Divider
                        sx={{ my: 1 }}
                        data-testid={`event-details-audit-divider-${index}`}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions data-testid="event-details-actions">
          {details?.event.status === "draft" && (
            <Button
              variant="outlined"
              onClick={() => setEditOpen(true)}
              data-testid="event-details-edit-button"
            >
              Edit
            </Button>
          )}

          <Button
            onClick={onClose}
            data-testid="event-details-close-button"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Event Modal */}
      <EditEventDialog
        open={editOpen}
        eventId={eventId}
        initialData={details}
        onClose={() => setEditOpen(false)}
        onUpdated={() => {
          onUpdated(); // refresh events tab
          fetchEventDetails(); // refresh this dialog
        }}
        showSnackbar={showSnackbar}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        data-testid="event-details-snackbar"
      >
        <Alert
          severity={snack.severity}
          data-testid="event-details-snackbar-alert"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );

};

export default EventDetailsDialog;
