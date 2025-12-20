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
  <Box sx={{ mt: 4, p: 2 }} id="schedule-container" data-testid="schedule-container">
    {loading ? (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
        id="loading-box"
        data-testid="loading-box"
      >
        <CircularProgress size={20} id="loading-spinner" data-testid="loading-spinner" />
        <Typography id="loading-text" data-testid="loading-text">
          Loading data...
        </Typography>
      </Box>
    ) : (
      <>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            id="error-alert"
            data-testid="error-alert"
          >
            {error}
          </Alert>
        )}

        <FormControl
          sx={{ minWidth: 200, mb: 3 }}
          id="user-filter-control"
          data-testid="user-filter-control"
        >
          <InputLabel
            id="user-filter-label"
            data-testid="user-filter-label"
          >
            Filter by User
          </InputLabel>

          <Select
            id="user-filter-select"
            data-testid="user-filter-select"
            value={selectedUserId}
            labelId="user-filter-label"
            label="Filter by User"
            onChange={(e) => {
              const val = String(e.target.value);
              setSelectedUserId(val === "" ? "" : Number(val));
            }}
          >
            <MenuItem
              id="user-filter-all"
              data-testid="user-filter-all"
              value=""
            >
              All Users
            </MenuItem>

            {users.map((user) => (
              <MenuItem
                key={user.id}
                value={user.id}
                id={`user-filter-${user.id}`}
                data-testid={`user-filter-${user.id}`}
              >
                {user.displayName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {displayedSchedules.length > 0 ? (
          <Table
            id="schedules-table"
            data-testid="schedules-table"
          >
            <TableHead>
              <TableRow data-testid="table-header-row">
                <TableCell id="table-header-title" data-testid="table-header-title">
                  Title
                </TableCell>
                <TableCell id="table-header-description" data-testid="table-header-description">
                  Description
                </TableCell>
                <TableCell id="table-header-start" data-testid="table-header-start">
                  Start
                </TableCell>
                <TableCell id="table-header-end" data-testid="table-header-end">
                  End
                </TableCell>
                <TableCell id="table-header-location" data-testid="table-header-location">
                  Location
                </TableCell>
                <TableCell id="table-header-importance" data-testid="table-header-importance">
                  Importance
                </TableCell>
                <TableCell id="table-header-recurrence" data-testid="table-header-recurrence">
                  Recurrence
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody data-testid="schedules-table-body">
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
                  data-testid={`schedule-row-${s.scheduleId}`}
                >
                  <TableCell
                    id={`schedule-title-${s.scheduleId}`}
                    data-testid={`schedule-title-${s.scheduleId}`}
                  >
                    {s.title}
                  </TableCell>

                  <TableCell
                    id={`schedule-description-${s.scheduleId}`}
                    data-testid={`schedule-description-${s.scheduleId}`}
                  >
                    {s.description}
                  </TableCell>

                  <TableCell
                    id={`schedule-start-${s.scheduleId}`}
                    data-testid={`schedule-start-${s.scheduleId}`}
                  >
                    {new Date(s.startAt).toLocaleString()}
                  </TableCell>

                  <TableCell
                    id={`schedule-end-${s.scheduleId}`}
                    data-testid={`schedule-end-${s.scheduleId}`}
                  >
                    {new Date(s.endAt).toLocaleString()}
                  </TableCell>

                  <TableCell
                    id={`schedule-location-${s.scheduleId}`}
                    data-testid={`schedule-location-${s.scheduleId}`}
                  >
                    {s.metadata.location}
                  </TableCell>

                  <TableCell
                    id={`schedule-importance-${s.scheduleId}`}
                    data-testid={`schedule-importance-${s.scheduleId}`}
                  >
                    {s.metadata.importance}
                  </TableCell>

                  <TableCell
                    id={`schedule-recurrence-${s.scheduleId}`}
                    data-testid={`schedule-recurrence-${s.scheduleId}`}
                  >
                    {formatRecurrence(s.recurrenceRule)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Alert
            severity="info"
            id="no-schedules-alert"
            data-testid="no-schedules-alert"
          >
            No schedules found.
          </Alert>
        )}
      </>
    )}

    <CreateScheduleButton
      onScheduleCreated={fetchSchedules}
      data-testid="create-schedule-button"
    />

    {/* --------- Edit Schedule Dialog --------- */}
    <EditScheduleDialog
      schedule={selectedSchedule}
      open={editDialogOpen}
      onClose={() => setEditDialogOpen(false)}
      onUpdated={fetchSchedules}
      data-testid="edit-schedule-dialog"
    />
  </Box>
);


};

export default SchedulePage;
