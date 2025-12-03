import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";
import { formatRecurrence } from "./recurrence";
import CreateScheduleButton from "./CreateScheduleButton";
import EditScheduleDialog from "./EditScheduleDialog";

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
  recurrenceRule: string;
  metadata: {
    location: string;
    importance: string;
  };
  assigneeUserId: number;
}

const SchedulePage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [displayedSchedules, setDisplayedSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch users and all schedules on mount
  const fetchSchedules = async () => {
  setLoading(true);
  setError(null);
  try {
    const [usersRes, schedulesRes] = await Promise.all([
      axiosNet.get("/v1/users"),
      axiosNet.get("/v1/schedules"),
    ]);

    setUsers(usersRes.data);
    setAllSchedules(schedulesRes.data.schedules || []);
    setDisplayedSchedules(schedulesRes.data.schedules || []);
  } catch (err: any) {
    setError(err?.message || "Failed to fetch data");
  } finally {
    setLoading(false);
  }
};

// call it on mount
useEffect(() => {
  fetchSchedules();
}, []);


  // Filter schedules when selectedUserId changes
  useEffect(() => {
    if (selectedUserId === "") {
      setDisplayedSchedules(allSchedules);
    } else {
      const filtered = allSchedules.filter(
        (s) => s.assigneeUserId === selectedUserId
      );
      setDisplayedSchedules(filtered);
    }
  }, [selectedUserId, allSchedules]);

  return (
    <Box sx={{ mt: 4, p: 2 }}>
      {/* <Typography variant="h5" gutterBottom>
        User Schedules
      </Typography> */}

      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Loading data...</Typography>
        </Box>
      ) : (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl sx={{ minWidth: 200, mb: 3 }}>
            <InputLabel>Filter by User</InputLabel>
            <Select
                value={selectedUserId}
                label="Filter by User"
                onChange={(e) => {
                const val = String(e.target.value);
                setSelectedUserId(val === "" ? "" : Number(val));
                }}
            >
                <MenuItem value="">All Users</MenuItem>
                {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                    {user.displayName}
                </MenuItem>
                ))}
            </Select>
            </FormControl>


          {displayedSchedules.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Importance</TableCell>
                  <TableCell>Recurrence</TableCell>
                  {/* <TableCell>Assignee</TableCell> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedSchedules.map((s) => (
                  <TableRow
                    key={s.scheduleId}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedSchedule(s);
                      setEditDialogOpen(true);
                    }}
                  >
                    <TableCell>{s.title}</TableCell>
                    <TableCell>{s.description}</TableCell>
                    <TableCell>{new Date(s.startAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(s.endAt).toLocaleString()}</TableCell>
                    <TableCell>{s.metadata.location}</TableCell>
                    <TableCell>{s.metadata.importance}</TableCell>
                    <TableCell>{formatRecurrence(s.recurrenceRule)}</TableCell>
                    {/* <TableCell>
                      {users.find((u) => u.id === s.assigneeUserId)?.displayName ||
                        s.assigneeUserId}
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info">No schedules found.</Alert>
          )}
        </>
      )}
      <CreateScheduleButton onScheduleCreated={fetchSchedules} />
      
      {/* --------- Edit Schedule Dialog --------- */}
      <EditScheduleDialog
        schedule={selectedSchedule}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onUpdated={fetchSchedules}
      />
    </Box>
  );
};

export default SchedulePage;
