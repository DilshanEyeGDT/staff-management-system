import React, { useEffect, useState } from "react";
import {
  Fab,
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
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import axiosNet from "../../../axiosConfig/axiosNet";
import axiosInstance from "../../../axiosConfig/axiosConfig";

interface User {
  id: number;
  displayName: string;
}

interface Props {
  onTaskCreated: () => void;
}

const CreateTaskButton: React.FC<Props> = ({ onTaskCreated }) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState("open");
  const [assigneeUserId, setAssigneeUserId] = useState<number | "">("");
  const [dueAt, setDueAt] = useState("");

  // Fetch users & current user id
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosNet.get("/v1/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await axiosInstance.get("/me");
        setCurrentUserId(res.data.id);
      } catch (err) {
        console.error("Failed to fetch current user id", err);
      }
    };

    fetchUsers();
    fetchCurrentUser();
  }, []);

  const handleSubmit = async () => {
    if (!title || !description || !assigneeUserId || !dueAt || !currentUserId) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      await axiosNet.post(
        "/v1/tasks",
        {
          createdByUserId: currentUserId,
          assigneeUserId,
          title,
          description,
          priority,
          status,
          dueAt: new Date(dueAt).toISOString(),
          metadata: {
            tags: [],
            category: "general",
          },
          idempotencyKey,
        },
        {
          headers: {
            "idempotency-key": idempotencyKey,
          },
        }
      );

      // Close dialog & reset
      setOpen(false);
      setTitle("");
      setDescription("");
      setPriority(1);
      setStatus("open");
      setAssigneeUserId("");
      setDueAt("");

      setSnackbarOpen(true);
      onTaskCreated(); // refresh tasks
    } catch (err) {
      console.error("Failed to create task", err);
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating + Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 32, right: 32 }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Assignee */}
          <FormControl fullWidth>
            <InputLabel>Assign To</InputLabel>
            <Select
              value={assigneeUserId}
              label="Assign To"
              onChange={(e) => setAssigneeUserId(e.target.value as any)}
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Priority */}
          <FormControl fullWidth>
            <InputLabel>Priority (1–3)</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              {[1, 2, 3].map((p) => (
                <MenuItem key={p} value={p}>
                  {p}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="inprogress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
          </FormControl>

          {/* Due Date */}
          <TextField
            label="Due Date"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            fullWidth
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={22} /> : "Create Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          Task created successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateTaskButton;
