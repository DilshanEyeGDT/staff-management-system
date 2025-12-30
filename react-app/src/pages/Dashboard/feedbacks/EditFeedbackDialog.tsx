// src/components/Feedback/EditFeedbackDialog.tsx
import React, { useEffect, useState } from "react";
import axiosLaravel from "../../../axiosConfig/axiosLaravel";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

interface User {
  id: number;
  display_name: string;
}

interface Props {
  open: boolean;
  feedbackId: number | null;
  currentStatus: string;
  currentPriority: string;
  currentAssigneeId: number;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
  onShowSnackbar: (msg: string, severity: "success" | "error") => void;
}

const EditFeedbackDialog: React.FC<Props> = ({
  open,
  feedbackId,
  currentStatus,
  currentPriority,
  currentAssigneeId,
  users,
  onClose,
  onSuccess,
  onShowSnackbar,
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [assigneeId, setAssigneeId] = useState<number>(currentAssigneeId);
  const [loading, setLoading] = useState(false);

  // Update values when a different feedback is selected
  useEffect(() => {
    setStatus(currentStatus);
    setPriority(currentPriority);
    setAssigneeId(currentAssigneeId);
  }, [currentStatus, currentPriority, currentAssigneeId]);

  const handleSubmit = async () => {
    if (!feedbackId) return;

    setLoading(true);
    try {
      await axiosLaravel.patch(`/api/v1/feedback/${feedbackId}`, {
        status,
        priority,
        assignee_id: assigneeId,
      });

      onSuccess();
      onClose();
      onShowSnackbar("Feedback updated successfully", "success");
    } catch (err) {
      console.error(err);
      onShowSnackbar("Failed to update feedback", "error");
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
      data-testid="edit-feedback-dialog"
    >
      <DialogTitle data-testid="edit-feedback-dialog-title">Edit Feedback</DialogTitle>

      <DialogContent>
        {/* STATUS */}
        <FormControl fullWidth sx={{ mt: 2 }} data-testid="edit-feedback-status-control">
          <InputLabel data-testid="edit-feedback-status-label">Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
            data-testid="edit-feedback-status-select"
          >
            <MenuItem value="open" data-testid="edit-feedback-status-open">Open</MenuItem>
            <MenuItem value="in_progress" data-testid="edit-feedback-status-in-progress">In Progress</MenuItem>
            <MenuItem value="closed" data-testid="edit-feedback-status-closed">Closed</MenuItem>
          </Select>
        </FormControl>

        {/* PRIORITY */}
        <FormControl fullWidth sx={{ mt: 2 }} data-testid="edit-feedback-priority-control">
          <InputLabel data-testid="edit-feedback-priority-label">Priority</InputLabel>
          <Select
            value={priority}
            label="Priority"
            onChange={(e) => setPriority(e.target.value)}
            data-testid="edit-feedback-priority-select"
          >
            <MenuItem value="low" data-testid="edit-feedback-priority-low">Low</MenuItem>
            <MenuItem value="medium" data-testid="edit-feedback-priority-medium">Medium</MenuItem>
            <MenuItem value="high" data-testid="edit-feedback-priority-high">High</MenuItem>
          </Select>
        </FormControl>

        {/* ASSIGNEE */}
        <FormControl fullWidth sx={{ mt: 2 }} data-testid="edit-feedback-assignee-control">
          <InputLabel data-testid="edit-feedback-assignee-label">Assignee</InputLabel>
          <Select
            value={assigneeId}
            label="Assignee"
            onChange={(e) => setAssigneeId(Number(e.target.value))}
            data-testid="edit-feedback-assignee-select"
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id} data-testid={`edit-feedback-assignee-option-${u.id}`}>
                {u.display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} data-testid="edit-feedback-cancel-button">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="edit-feedback-submit-button"
        >
          {loading ? <CircularProgress size={20} data-testid="edit-feedback-loading-indicator" /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );

};

export default EditFeedbackDialog;
