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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="create-feedback-dialog"
    >
      <DialogTitle data-testid="create-feedback-title">
        Create Feedback
      </DialogTitle>

      <DialogContent data-testid="create-feedback-content">
        {/* Title */}
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 1 }}
          data-testid="feedback-title-input"
        />

        {/* Category */}
        <TextField
          fullWidth
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ mt: 2 }}
          data-testid="feedback-category-input"
        />

        {/* Priority */}
        <FormControl
          fullWidth
          sx={{ mt: 2 }}
          data-testid="feedback-priority-select-wrapper"
        >
          <InputLabel data-testid="feedback-priority-label">
            Priority
          </InputLabel>
          <Select
            value={priority}
            label="Priority"
            onChange={(e) => setPriority(e.target.value)}
            data-testid="feedback-priority-select"
          >
            <MenuItem value="low" data-testid="priority-option-low">
              Low
            </MenuItem>
            <MenuItem value="medium" data-testid="priority-option-medium">
              Medium
            </MenuItem>
            <MenuItem value="high" data-testid="priority-option-high">
              High
            </MenuItem>
          </Select>
        </FormControl>

        {/* Assignee */}
        <FormControl
          fullWidth
          sx={{ mt: 2 }}
          data-testid="feedback-assignee-select-wrapper"
        >
          <InputLabel data-testid="feedback-assignee-label">
            Assignee
          </InputLabel>
          <Select
            value={assigneeId}
            label="Assignee"
            onChange={(e) => setAssigneeId(Number(e.target.value))}
            data-testid="feedback-assignee-select"
          >
            {users.map((u) => (
              <MenuItem
                key={u.id}
                value={u.id}
                data-testid={`assignee-option-${u.id}`}
              >
                {u.display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Attachments */}
        <Box sx={{ mt: 3 }} data-testid="feedback-attachments-section">
          <Button
            variant="outlined"
            component="label"
            data-testid="feedback-upload-button"
          >
            Upload Files
            <input
              hidden
              multiple
              type="file"
              onChange={handleFileSelect}
              data-testid="feedback-file-input"
            />
          </Button>

          {attachments.map((f, i) => (
            <Typography
              key={i}
              variant="body2"
              data-testid={`attachment-item-${i}`}
            >
              • {f.file_name} ({f.file_type})
            </Typography>
          ))}
        </Box>
      </DialogContent>

      <DialogActions data-testid="create-feedback-actions">
        <Button
          onClick={onClose}
          data-testid="create-feedback-cancel-button"
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="create-feedback-submit-button"
        >
          {loading ? (
            <CircularProgress
              size={20}
              data-testid="create-feedback-loading"
            />
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );

};

export default AddFeedbackDialog;
