// src/components/schedules/CreateScheduleButton.tsx
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
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import axiosNet from "../../../axiosConfig/axiosNet"; // .NET endpoints
import axiosInstance from "../../../axiosConfig/axiosConfig"; // Auth endpoints

interface User {
  id: number;
  displayName: string;
}

interface Props {
  onScheduleCreated: () => void; // callback to refresh schedules
}

const TEAM_ID = "7f5a9f14-1c2a-4d3e-a9c3-9b8b2f1a2c3d";

const recurrenceOptions = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];

const CreateScheduleButton: React.FC<Props> = ({ onScheduleCreated }) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<number | "">("");
  const [recurrenceRule, setRecurrenceRule] = useState("NONE");
  const [location, setLocation] = useState("");
  const [importance, setImportance] = useState("high");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  // Fetch users for assignee dropdown
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
        console.error("Failed to fetch current user", err);
      }
    };

    fetchUsers();
    fetchCurrentUser();
  }, []);

  const handleSubmit = async () => {
    if (!title || !description || !assigneeUserId || !startAt || !endAt || !currentUserId) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await axiosNet.post("/v1/schedules", {
        createdByUserId: currentUserId,
        assigneeUserId,
        teamId: TEAM_ID,
        title,
        description,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        recurrenceRule,
        metadata: {
          location,
          importance,
        },
      });

      setOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setAssigneeUserId("");
      setRecurrenceRule("NONE");
      setLocation("");
      setImportance("high");
      setStartAt("");
      setEndAt("");

      onScheduleCreated(); // refresh main schedule list
    } catch (err) {
      console.error("Failed to create schedule", err);
      alert("Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setOpen(true)}
        sx={{ position: "fixed", bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Schedule</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
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

          <FormControl fullWidth>
            <InputLabel>Recurrence</InputLabel>
            <Select
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value)}
              label="Recurrence"
            >
              {recurrenceOptions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Importance</InputLabel>
            <Select
              value={importance}
              onChange={(e) => setImportance(e.target.value)}
              label="Importance"
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
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
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateScheduleButton;
