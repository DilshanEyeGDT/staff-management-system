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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Event</DialogTitle>

      <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

        <TextField
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          fullWidth
        />

        <TextField
          label="Summary"
          name="summary"
          value={form.summary}
          onChange={handleChange}
          fullWidth
        />

        <TextField
          label="Content"
          name="content"
          value={form.content}
          onChange={handleChange}
          multiline
          rows={4}
          fullWidth
        />

        <TextField
          label="Scheduled At"
          type="datetime-local"
          name="scheduled_at"
          value={form.scheduled_at}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEventDialog;
