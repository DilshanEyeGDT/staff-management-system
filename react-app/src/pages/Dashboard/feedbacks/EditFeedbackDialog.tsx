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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Feedback</DialogTitle>

      <DialogContent>
        {/* STATUS */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>

        {/* PRIORITY */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>

        {/* ASSIGNEE */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Assignee</InputLabel>
          <Select
            value={assigneeId}
            label="Assignee"
            onChange={(e) => setAssigneeId(Number(e.target.value))}
          >
            {users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditFeedbackDialog;
