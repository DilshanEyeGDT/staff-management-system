// src/components/Feedback/AddFeedbackDialog.tsx
import React, { useEffect, useState } from "react";
import axiosLaravel from "../../../axiosConfig/axiosLaravel";
import axiosAuth from "../../../axiosConfig/axiosConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";

interface User {
  id: number;
  display_name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowSnackbar: (msg: string, severity: "success" | "error") => void;
}

const AddFeedbackDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  onShowSnackbar,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState<number | "">("");
  const [attachments, setAttachments] = useState<
    { file_name: string; file_type: string }[]
  >([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- Load current user ---------- */
  useEffect(() => {
    axiosAuth
      .get("/me")
      .then((res) => setCurrentUserId(res.data.id))
      .catch(() => console.error("Failed to load current user"));
  }, []);

  /* ---------- Load assignees ---------- */
  useEffect(() => {
    axiosLaravel
      .get("/api/v1/users")
      .then((res) => setUsers(res.data.data || []))
      .catch(() => console.error("Failed to load users"));
  }, []);

  /* ---------- File select ---------- */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files).map((file) => ({
      file_name: file.name,
      file_type: file.type || "unknown",
    }));

    setAttachments(files);
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    if (!currentUserId || !title || !category || !priority || !assigneeId)
      return;

    setLoading(true);
    try {
      await axiosLaravel.post("/api/v1/feedback", {
        user_id: currentUserId,
        assignee_id: assigneeId,
        title,
        category,
        priority,
        attachments,
      });

      onSuccess();
      onClose();
      onShowSnackbar("Feedback created successfully", "success");

      // Reset form
      setTitle("");
      setCategory("");
      setPriority("");
      setAssigneeId("");
      setAttachments([]);
    } catch (err) {
      console.error(err);
      onShowSnackbar("Failed to create feedback", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Feedback</DialogTitle>

      <DialogContent>
        <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mt: 1 }} />
        <TextField fullWidth label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ mt: 2 }} />

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Assignee</InputLabel>
          <Select value={assigneeId} label="Assignee" onChange={(e) => setAssigneeId(Number(e.target.value))}>
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 3 }}>
          <Button variant="outlined" component="label">
            Upload Files
            <input hidden multiple type="file" onChange={handleFileSelect} />
          </Button>

          {attachments.map((f, i) => (
            <Typography key={i} variant="body2">
              • {f.file_name} ({f.file_type})
            </Typography>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFeedbackDialog;
