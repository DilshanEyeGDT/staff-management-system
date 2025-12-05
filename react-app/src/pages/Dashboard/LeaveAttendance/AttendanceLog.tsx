import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  Stack,
  Pagination,
} from "@mui/material";
import axiosLambda from "../../../axiosConfig/axiosLambda"

type User = {
  user_id: number;
  display_name: string;
};

type AttendanceLogItem = {
  attendance_log_id: number;
  clock_in_time: string | null;
  clock_out_time: string | null;
  attendance_status: string;
  date: string;
};

const DEFAULT_PAGE_SIZE = 5;

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    // Convert to local string with date + time
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const AttendanceLog: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [startDate, setStartDate] = useState<string>(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>(""); // yyyy-mm-dd

  const [logs, setLogs] = useState<AttendanceLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1); // API page is 1-based
  const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Fetch users for dropdown
  useEffect(() => {
    setUsersLoading(true);
    setUsersError(null);
    axiosLambda
      .get("/api/v1/users")
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch users", err);
        setUsersError(err?.response?.data?.message || "Failed to load users");
      })
      .finally(() => setUsersLoading(false));
  }, []);

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page,
      size,
    };
    if (selectedUserId) params.user_id = selectedUserId;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return params;
  }, [selectedUserId, startDate, endDate, page, size]);

  // Fetch attendance logs when selectedUserId or filters or page change
  useEffect(() => {
    // Do not fetch until a user is selected
    if (!selectedUserId) {
      setLogs([]);
      setTotalPages(0);
      return;
    }

    setLogsLoading(true);
    setLogsError(null);

    axiosLambda
      .get("/api/v1/attendance", { params: queryParams })
      .then((res) => {
        const data = res.data?.data;
        const pagination = data?.pagination;
        const attendanceLogs = data?.attendanceLogs || [];

        setLogs(attendanceLogs);
        if (pagination) {
          const total = pagination.total ?? attendanceLogs.length;
          const pageSize = pagination.size ?? size;
          setSize(pageSize);
          setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
        } else {
          setTotalPages(1);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch attendance logs", err);
        setLogsError(err?.response?.data?.message || "Failed to load attendance logs");
        setLogs([]);
        setTotalPages(0);
      })
      .finally(() => setLogsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams, selectedUserId]);

  const handleUserChange = (v: number | "") => {
    setSelectedUserId(v);
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    // effect already depends on startDate/endDate/page -> will refetch
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
  <Box id="attendance-log-page">
    <Typography variant="h6" sx={{ mb: 2 }} id="title-attendance-log">
      Attendance Log
    </Typography>

    {/* Controls */}
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems="center"
      sx={{ mb: 2 }}
      id="filter-section"
    >

      {/* User Dropdown */}
      <FormControl sx={{ minWidth: 220 }} id="select-user-container">
        <InputLabel id="select-user-label">Select User</InputLabel>

        {usersLoading ? (
          <Box display="flex" alignItems="center" px={2} py={1} id="loading-users">
            <CircularProgress size={20} id="loading-users-spinner" />
            <Typography sx={{ ml: 1 }}></Typography>
          </Box>
        ) : (
          <Select
            id="select-user"
            labelId="select-user-label"
            value={selectedUserId}
            label="Select User"
            onChange={(e) => handleUserChange(e.target.value as number)}
            displayEmpty
          >
            <MenuItem value="" id="select-user-empty">
              <em></em>
            </MenuItem>

            {users.map((u) => (
              <MenuItem
                key={u.user_id}
                value={u.user_id}
                id={`select-user-option-${u.user_id}`}
              >
                {u.display_name}
              </MenuItem>
            ))}
          </Select>
        )}

        {usersError && (
          <Typography color="error" variant="caption" id="users-error">
            {usersError}
          </Typography>
        )}
      </FormControl>

      {/* Date Inputs */}
      <TextField
        label="Start date"
        type="date"
        id="start-date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        label="End date"
        type="date"
        id="end-date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      {/* If Search & Clear buttons are re-enabled */}
      {/* <Button id="btn-search" variant="contained" onClick={handleSearch} disabled={!selectedUserId}>
        Search
      </Button>

      <Button id="btn-clear" variant="outlined" onClick={handleClearFilters}>
        Clear
      </Button> */}
    </Stack>

    {/* Results */}
    <Box id="results-section">
      {logsLoading ? (
        <Box display="flex" alignItems="center" justifyContent="center" py={6} id="loading-logs">
          <CircularProgress id="loading-logs-spinner" />
        </Box>
      ) : logsError ? (
        <Typography color="error" id="logs-error">{logsError}</Typography>
      ) : !selectedUserId ? (
        <Typography id="no-user-selected">Please select a user to view attendance logs.</Typography>
      ) : logs.length === 0 ? (
        <Typography id="no-logs">No attendance records found for the selected filters.</Typography>
      ) : (
        <Table id="logs-table">
          <TableHead id="logs-table-head">
            <TableRow>
              <TableCell id="col-date">Date</TableCell>
              <TableCell id="col-clock-in">Clock In</TableCell>
              <TableCell id="col-clock-out">Clock Out</TableCell>
              <TableCell id="col-status">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody id="logs-table-body">
            {logs.map((log) => (
              <TableRow key={log.attendance_log_id} id={`log-row-${log.attendance_log_id}`}>
                <TableCell id={`log-date-${log.attendance_log_id}`}>
                  {new Date(log.date).toLocaleDateString()}
                </TableCell>
                <TableCell id={`log-clock-in-${log.attendance_log_id}`}>
                  {formatDateTime(log.clock_in_time)}
                </TableCell>
                <TableCell id={`log-clock-out-${log.attendance_log_id}`}>
                  {formatDateTime(log.clock_out_time)}
                </TableCell>
                <TableCell id={`log-status-${log.attendance_log_id}`}>
                  {log.attendance_status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>

    {/* Pagination */}
    {totalPages > 1 && (
      <Box display="flex" justifyContent="center" mt={2} id="pagination-section">
        <Pagination
          id="pagination"
          count={totalPages}
          page={page}
          onChange={(_e, value) => setPage(value)}
          color="primary"
        />
      </Box>
    )}
  </Box>
);

};

export default AttendanceLog;
