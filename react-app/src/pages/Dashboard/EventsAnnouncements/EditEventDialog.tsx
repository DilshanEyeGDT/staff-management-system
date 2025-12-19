// src/components/events/EditEventDialog.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
import axiosGo from "../../../axiosConfig/axiosGo";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  eventId: number | null;
  initialData: any;       // event + announcement
  onClose: () => void;
  onUpdated: () => void;  // callback after successful update
  showSnackbar: (msg: string, severity?: "success" | "error") => void;
}

const EditEventDialog: React.FC<Props> = ({
  open,
  eventId,
  initialData,
  onClose,
  onUpdated,
  showSnackbar,
}) => {
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    scheduled_at: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.event.title || "",
        summary: initialData.event.summary || "",
        content: initialData.announcement.content || "",
        scheduled_at: dayjs(initialData.event.scheduled_at)
          .format("YYYY-MM-DDTHH:mm"),
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      await axiosGo.patch(`/events/${eventId}`, {
        title: form.title,
        summary: form.summary,
        content: form.content,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      });

      showSnackbar("Event updated successfully!", "success");
      onUpdated();
      onClose();
    } catch (err: any) {
      showSnackbar("Failed to update event", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="md"
    data-testid="edit-event-dialog"
  >
    <DialogTitle data-testid="edit-event-title">Edit Event</DialogTitle>

    <DialogContent
      dividers
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      data-testid="edit-event-content"
    >
      <TextField
        label="Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        fullWidth
        data-testid="edit-event-title-input"
      />

      <TextField
        label="Summary"
        name="summary"
        value={form.summary}
        onChange={handleChange}
        fullWidth
        data-testid="edit-event-summary-input"
      />

      <TextField
        label="Content"
        name="content"
        value={form.content}
        onChange={handleChange}
        multiline
        rows={4}
        fullWidth
        data-testid="edit-event-content-input"
      />

      <TextField
        label="Scheduled At"
        type="datetime-local"
        name="scheduled_at"
        value={form.scheduled_at}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        fullWidth
        data-testid="edit-event-scheduled-at-input"
      />
    </DialogContent>

    <DialogActions data-testid="edit-event-actions">
      <Button
        onClick={onClose}
        disabled={loading}
        data-testid="edit-event-cancel-button"
      >
        Cancel
      </Button>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading}
        data-testid="edit-event-submit-button"
      >
        {loading ? (
          <CircularProgress
            size={20}
            data-testid="edit-event-submit-loading"
          />
        ) : (
          "Update"
        )}
      </Button>
    </DialogActions>
  </Dialog>
);

};

export default EditEventDialog;
