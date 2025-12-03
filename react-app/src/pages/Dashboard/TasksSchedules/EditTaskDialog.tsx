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
} from "@mui/material";

import axiosNet from "../../../axiosConfig/axiosNet";
import AddTaskCommentDialog from "./AddTaskCommentDialog";

interface User {
  id: number;
  displayName: string;
}

interface Task {
  taskId: string;
  title: string;
  description: string;
  priority: number;
  status: string;
  dueAt: string;
  assigneeUserId: number;
}

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const EditTaskDialog: React.FC<Props> = ({ task, open, onClose, onUpdated }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState("open");
  const [assigneeUserId, setAssigneeUserId] = useState<number | "">("");
  const [dueAt, setDueAt] = useState("");

  //comment state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);


  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error">("success");

  // Load selected task
  useEffect(() => {
    if (!task) return;

    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setStatus(task.status);
    setAssigneeUserId(task.assigneeUserId);
    setDueAt(task.dueAt.slice(0, 16));
  }, [task]);

  // Fetch Users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axiosNet.get("/v1/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    loadUsers();
  }, []);

  const handleUpdate = async () => {
    if (!task) return;

    setLoading(true);
    try {
      await axiosNet.patch(`/v1/tasks/${task.taskId}`, {
        title,
        description,
        priority,
        status,
        assigneeUserId,
        dueAt: new Date(dueAt).toISOString(),
      });

      setSnackbarMsg("Task updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setSnackbarMsg("Failed to update task!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Task</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              <MenuItem value={1}>1 - Low</MenuItem>
              <MenuItem value={2}>2 - Medium</MenuItem>
              <MenuItem value={3}>3 - High</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Assignee</InputLabel>
            <Select
              label="Assignee"
              value={assigneeUserId}
              onChange={(e) => setAssigneeUserId(Number(e.target.value))}
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Due At"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />

          {/* ADD COMMENT BUTTON (no logic yet) */}
          <Button
            variant="outlined"
            onClick={() => setCommentDialogOpen(true)}
            disabled={!task}
            >
            Add Comment
            </Button>

        </DialogContent>

        <AddTaskCommentDialog
            taskId={task?.taskId || null}
            open={commentDialogOpen}
            onClose={() => setCommentDialogOpen(false)}
            />


        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdate} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Update Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditTaskDialog;
