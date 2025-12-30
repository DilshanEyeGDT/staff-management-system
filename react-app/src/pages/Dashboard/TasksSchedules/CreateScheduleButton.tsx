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
  // Fetch users for assignee dropdown
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

useEffect(() => {
  if (open) {
    fetchUsers();
    fetchCurrentUser();
  }
}, [open]);

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
      data-testid="create-schedule-fab"
    >
      <AddIcon data-testid="create-schedule-fab-icon" />
    </Fab>

    <Dialog
  open={open}
  onClose={(event, reason) => {
    // 🔒 prevent backdrop / focus auto-close
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }
    setOpen(false);
  }}
  disableEscapeKeyDown
  maxWidth="sm"
  fullWidth
  data-testid="create-schedule-dialog"
>

      <DialogTitle data-testid="create-schedule-title">
        Create New Schedule
      </DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        data-testid="create-schedule-content"
      >
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          data-testid="schedule-title-input"
        />

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          data-testid="schedule-description-input"
        />

        <FormControl fullWidth data-testid="schedule-assignee-control">
          <InputLabel data-testid="schedule-assignee-label">
            Assignee
          </InputLabel>
          <Select
            value={assigneeUserId}
            onChange={(e) => setAssigneeUserId(Number(e.target.value))}
            label="Assignee"
            data-testid="schedule-assignee-select"
          >
            {users.map((u) => (
              <MenuItem
                key={u.id}
                value={u.id}
                data-testid={`schedule-assignee-${u.id}`}
              >
                {u.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth data-testid="schedule-recurrence-control">
          <InputLabel data-testid="schedule-recurrence-label">
            Recurrence
          </InputLabel>
          <Select
            value={recurrenceRule}
            onChange={(e) => setRecurrenceRule(e.target.value)}
            label="Recurrence"
            data-testid="schedule-recurrence-select"
          >
            {recurrenceOptions.map((r) => (
              <MenuItem
                key={r}
                value={r}
                data-testid={`schedule-recurrence-${r}`}
              >
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
          data-testid="schedule-location-input"
        />

        <FormControl fullWidth data-testid="schedule-importance-control">
          <InputLabel data-testid="schedule-importance-label">
            Importance
          </InputLabel>
          <Select
            value={importance}
            onChange={(e) => setImportance(e.target.value)}
            label="Importance"
            data-testid="schedule-importance-select"
          >
            <MenuItem value="high" data-testid="schedule-importance-high">
              High
            </MenuItem>
            <MenuItem value="medium" data-testid="schedule-importance-medium">
              Medium
            </MenuItem>
            <MenuItem value="low" data-testid="schedule-importance-low">
              Low
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Start Time"
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          data-testid="schedule-start-time-input"
        />

        <TextField
          label="End Time"
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          data-testid="schedule-end-time-input"
        />
      </DialogContent>

      <DialogActions data-testid="create-schedule-actions">
        <Button
          onClick={() => setOpen(false)}
          disabled={loading}
          data-testid="create-schedule-cancel-button"
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          data-testid="create-schedule-submit-button"
        >
          {loading ? (
            <CircularProgress size={20} data-testid="create-schedule-loading" />
          ) : (
            "Create"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  </>
);

};

export default CreateScheduleButton;
