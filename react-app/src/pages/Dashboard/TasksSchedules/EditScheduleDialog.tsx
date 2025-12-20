import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";

interface User {
  id: number;
  displayName: string;
}

interface Schedule {
  scheduleId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  assigneeUserId: number;
  metadata: {
    location: string;
    importance: string;
  };
}

interface Props {
  schedule: Schedule | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const EditScheduleDialog: React.FC<Props> = ({ schedule, open, onClose, onUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<number | "">("");
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!schedule) return;
    setStartAt(schedule.startAt.slice(0, 16));
    setEndAt(schedule.endAt.slice(0, 16));
    setAssigneeUserId(schedule.assigneeUserId);
  }, [schedule]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosNet.get("/v1/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  const handleUpdate = async () => {
    if (!schedule || !startAt || !endAt || !assigneeUserId) return;
    setLoading(true);
    try {
      await axiosNet.patch(`/v1/schedules/${schedule.scheduleId}`, {
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        assigneeUserId,
      });
      setSnackbarMsg("Schedule updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setSnackbarMsg("Failed to update schedule!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    setLoading(true);
    try {
      await axiosNet.delete(`/v1/schedules/${schedule.scheduleId}`);
      setSnackbarMsg("Schedule deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      onUpdated();
      setDeleteConfirmOpen(false);
      onClose();
    } catch (err) {
      console.error(err);
      setSnackbarMsg("Failed to delete schedule!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="edit-schedule-dialog"
    >
      <DialogTitle data-testid="edit-schedule-title">
        Edit or Delete Schedule
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        data-testid="edit-schedule-content"
      >
        <FormControl fullWidth data-testid="edit-schedule-assignee-control">
          <InputLabel data-testid="edit-schedule-assignee-label">
            Assignee
          </InputLabel>
          <Select
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(Number(e.target.value))}
            label="Assignee"
            data-testid="edit-schedule-assignee-select"
          >
            {users.map((u) => (
              <MenuItem
                key={u.id}
                value={u.id}
                data-testid={`edit-schedule-assignee-${u.id}`}
              >
                {u.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Start Time"
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          data-testid="edit-schedule-start-time-input"
        />

        <TextField
          label="End Time"
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          data-testid="edit-schedule-end-time-input"
        />
      </DialogContent>

      <DialogActions data-testid="edit-schedule-actions">
        <Button
          color="error"
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={loading}
          data-testid="edit-schedule-delete-button"
        >
          Delete
        </Button>

        <Button
          onClick={onClose}
          disabled={loading}
          data-testid="edit-schedule-cancel-button"
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={loading}
          data-testid="edit-schedule-update-button"
        >
          {loading ? (
            <CircularProgress size={20} data-testid="edit-schedule-update-loading" />
          ) : (
            "Update"
          )}
        </Button>
      </DialogActions>
    </Dialog>

    {/* ---------- Delete Confirmation Dialog ---------- */}
    <Dialog
      open={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      data-testid="delete-schedule-confirm-dialog"
    >
      <DialogTitle data-testid="delete-schedule-confirm-title">
        Confirm Delete
      </DialogTitle>

      <DialogContent data-testid="delete-schedule-confirm-content">
        <Typography data-testid="delete-schedule-confirm-text">
          Are you sure you want to delete this schedule?
        </Typography>
      </DialogContent>

      <DialogActions data-testid="delete-schedule-confirm-actions">
        <Button
          onClick={() => setDeleteConfirmOpen(false)}
          data-testid="delete-schedule-confirm-cancel"
        >
          Cancel
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={handleDelete}
          data-testid="delete-schedule-confirm-delete"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>

    {/* ---------- Snackbar Alert ---------- */}
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      data-testid="schedule-snackbar"
    >
      <Alert
        onClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
        sx={{ width: "100%" }}
        data-testid="schedule-snackbar-alert"
      >
        {snackbarMsg}
      </Alert>
    </Snackbar>
  </>
);

};

export default EditScheduleDialog;
