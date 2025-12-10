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
} from "@mui/material";
import axiosGo from "../../../axiosConfig/axiosGo";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  eventId: number | null;
  onClose: () => void;
}

const EventDetailsDialog: React.FC<Props> = ({ open, eventId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            
            {/* Event Info */}
            <Box>
              <Typography variant="h6">{details.event.title}</Typography>
              <Typography>{details.event.summary}</Typography>
              <Typography variant="caption" color="text.secondary">
                Scheduled:{" "}
                {dayjs(details.event.scheduled_at).format("YYYY-MM-DD HH:mm")}
              </Typography>
            </Box>

            <Divider />

            {/* Announcement */}
            <Box>
              <Typography variant="subtitle1">Announcement</Typography>
              <Typography>{details.announcement.content}</Typography>

              {details.announcement.attachments?.length > 0 &&
                details.announcement.attachments.map((file: string) => (
                  <Chip
                    key={file}
                    label={file}
                    variant="outlined"
                    sx={{ mt: 1, mr: 1 }}
                  />
                ))}
            </Box>

            <Divider />

            {/* Tags */}
            <Box>
              <Typography variant="subtitle1">Tags</Typography>
              {details.tags.map((tag: any) => (
                <Chip
                  key={tag.id}
                  label={tag.tag}
                  color="primary"
                  size="small"
                  sx={{ mr: 1, mt: 1 }}
                />
              ))}
            </Box>

            <Divider />

            {/* Audit Logs */}
            <Box>
              <Typography variant="subtitle1">Publish Audit</Typography>
              {details.publish_audit.map((audit: any) => (
                <Box key={audit.id} sx={{ mb: 1 }}>
                  <Typography>
                    <strong>Action:</strong> {audit.action}
                  </Typography>
                  <Typography>
                    <strong>Channel:</strong> {audit.channel}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(audit.performed_at).format(
                      "YYYY-MM-DD HH:mm:ss"
                    )}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailsDialog;
