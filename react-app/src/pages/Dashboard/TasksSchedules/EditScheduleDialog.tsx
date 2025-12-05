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
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit or Delete Schedule</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Assignee</InputLabel>
            <Select
              value={assigneeUserId}
              onChange={(e) => setAssigneeUserId(Number(e.target.value))}
              label="Assignee"
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
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
          />
          <TextField
            label="End Time"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setDeleteConfirmOpen(true)} disabled={loading}>
            Delete
          </Button>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdate} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Delete Confirmation Dialog ---------- */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this schedule?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
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
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditScheduleDialog;
