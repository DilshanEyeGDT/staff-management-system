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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      data-testid="edit-task-dialog"
    >
      <DialogTitle data-testid="edit-task-title">
        Edit Task
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        data-testid="edit-task-content"
      >
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="edit-task-title-input"
        />

        <TextField
          fullWidth
          label="Description"
          multiline
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="edit-task-description-input"
        />

        <FormControl fullWidth data-testid="edit-task-status-control">
          <InputLabel data-testid="edit-task-status-label">
            Status
          </InputLabel>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            data-testid="edit-task-status-select"
          >
            <MenuItem value="open" data-testid="edit-task-status-open">
              Open
            </MenuItem>
            <MenuItem value="inprogress" data-testid="edit-task-status-inprogress">
              In Progress
            </MenuItem>
            <MenuItem value="done" data-testid="edit-task-status-done">
              Done
            </MenuItem>
            <MenuItem value="cancelled" data-testid="edit-task-status-cancelled">
              Cancelled
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth data-testid="edit-task-priority-control">
          <InputLabel data-testid="edit-task-priority-label">
            Priority
          </InputLabel>
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            data-testid="edit-task-priority-select"
          >
            <MenuItem value={1} data-testid="edit-task-priority-1">
              1 - Low
            </MenuItem>
            <MenuItem value={2} data-testid="edit-task-priority-2">
              2 - Medium
            </MenuItem>
            <MenuItem value={3} data-testid="edit-task-priority-3">
              3 - High
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth data-testid="edit-task-assignee-control">
          <InputLabel data-testid="edit-task-assignee-label">
            Assignee
          </InputLabel>
          <Select
            label="Assignee"
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(Number(e.target.value))}
            data-testid="edit-task-assignee-select"
          >
            {users.map((u) => (
              <MenuItem
                key={u.id}
                value={u.id}
                data-testid={`edit-task-assignee-${u.id}`}
              >
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
          data-testid="edit-task-due-at-input"
        />

        {/* ADD COMMENT BUTTON (no logic yet) */}
        <Button
          variant="outlined"
          onClick={() => setCommentDialogOpen(true)}
          disabled={!task}
          data-testid="edit-task-add-comment-button"
        >
          Add Comment
        </Button>
      </DialogContent>

      <AddTaskCommentDialog
        taskId={task?.taskId || null}
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        data-testid="add-task-comment-dialog"
      />

      <DialogActions data-testid="edit-task-actions">
        <Button
          onClick={onClose}
          disabled={loading}
          data-testid="edit-task-cancel-button"
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={loading}
          data-testid="edit-task-update-button"
        >
          {loading ? (
            <CircularProgress size={20} data-testid="edit-task-update-loading" />
          ) : (
            "Update Task"
          )}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Snackbar */}
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      onClose={() => setSnackbarOpen(false)}
      data-testid="edit-task-snackbar"
    >
      <Alert
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
        variant="filled"
        data-testid="edit-task-snackbar-alert"
      >
        {snackbarMsg}
      </Alert>
    </Snackbar>
  </>
);

};

export default EditTaskDialog;
