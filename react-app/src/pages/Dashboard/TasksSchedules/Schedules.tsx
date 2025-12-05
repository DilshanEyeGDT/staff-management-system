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
    <Box sx={{ mt: 4, p: 2 }} id="schedule-container">
      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} id="loading-box">
          <CircularProgress size={20} id="loading-spinner" />
          <Typography id="loading-text">Loading data...</Typography>
        </Box>
      ) : (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} id="error-alert">
              {error}
            </Alert>
          )}

          <FormControl sx={{ minWidth: 200, mb: 3 }} id="user-filter-control">
            <InputLabel id="user-filter-label">Filter by User</InputLabel>
            <Select
              id="user-filter-select"
              value={selectedUserId}
              labelId="user-filter-label"
              label="Filter by User"
              onChange={(e) => {
                const val = String(e.target.value);
                setSelectedUserId(val === "" ? "" : Number(val));
              }}
            >
              <MenuItem id="user-filter-all" value="">
                All Users
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id} id={`user-filter-${user.id}`}>
                  {user.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {displayedSchedules.length > 0 ? (
            <Table id="schedules-table">
              <TableHead>
                <TableRow>
                  <TableCell id="table-header-title">Title</TableCell>
                  <TableCell id="table-header-description">Description</TableCell>
                  <TableCell id="table-header-start">Start</TableCell>
                  <TableCell id="table-header-end">End</TableCell>
                  <TableCell id="table-header-location">Location</TableCell>
                  <TableCell id="table-header-importance">Importance</TableCell>
                  <TableCell id="table-header-recurrence">Recurrence</TableCell>
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
                    id={`schedule-row-${s.scheduleId}`}
                  >
                    <TableCell id={`schedule-title-${s.scheduleId}`}>{s.title}</TableCell>
                    <TableCell id={`schedule-description-${s.scheduleId}`}>{s.description}</TableCell>
                    <TableCell id={`schedule-start-${s.scheduleId}`}>
                      {new Date(s.startAt).toLocaleString()}
                    </TableCell>
                    <TableCell id={`schedule-end-${s.scheduleId}`}>
                      {new Date(s.endAt).toLocaleString()}
                    </TableCell>
                    <TableCell id={`schedule-location-${s.scheduleId}`}>{s.metadata.location}</TableCell>
                    <TableCell id={`schedule-importance-${s.scheduleId}`}>
                      {s.metadata.importance}
                    </TableCell>
                    <TableCell id={`schedule-recurrence-${s.scheduleId}`}>
                      {formatRecurrence(s.recurrenceRule)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert severity="info" id="no-schedules-alert">
              No schedules found.
            </Alert>
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
