import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import axiosLambda from "../../../axiosLambda";

type User = {
  user_id: number;
  display_name: string;
};

type KPIData = {
  user_id: number;
  display_name: string;
  leave_type: string;
  total_leave_taken: number;
  remaining_days: number;
  attendance: {
    total_present: number;
    total_absent: number;
    total_leave: number;
  };
};

const KPI: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fetch users for dropdown
  useEffect(() => {
    setUsersLoading(true);
    axiosLambda
      .get("/api/v1/users")
      .then((res) => setUsers(res.data || []))
      .catch((err) => {
        console.error(err);
        setUsersError(err?.response?.data?.message || "Failed to load users");
      })
      .finally(() => setUsersLoading(false));
  }, []);

  const fetchKPI = () => {
    if (!selectedUserId || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    axiosLambda
      .get("/api/v1/reports/leave-summary", {
        params: { user_id: selectedUserId, start_date: startDate, end_date: endDate },
      })
      .then((res) => {
        setKpiData(res.data?.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to fetch KPI data");
        setKpiData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, startDate, endDate]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        KPI - Leave & Attendance Summary
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {/* User Dropdown */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select User</InputLabel>
          {usersLoading ? (
            <CircularProgress size={20} />
          ) : (
            <Select
              value={selectedUserId}
              label="Select User"
              onChange={(e) => setSelectedUserId(e.target.value as number)}
              displayEmpty
            >
              <MenuItem value="">
                <em></em>
              </MenuItem>
              {users.map((u) => (
                <MenuItem key={u.user_id} value={u.user_id}>
                  {u.display_name}
                </MenuItem>
              ))}
            </Select>
          )}
          {usersError && <Typography color="error">{usersError}</Typography>}
        </FormControl>

        {/* Start Date */}
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        {/* End Date */}
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !selectedUserId || !startDate || !endDate ? (
        <Typography>Please select user, start date, and end date to view KPI.</Typography>
      ) : kpiData.length === 0 ? (
        <Typography>No KPI data found.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Leave Type</TableCell>
              <TableCell>Total Leave Taken</TableCell>
              <TableCell>Remaining Days</TableCell>
              <TableCell>Total Present</TableCell>
              <TableCell>Total Absent</TableCell>
              <TableCell>Total Leave</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {kpiData.map((kpi, index) => (
              <TableRow key={index}>
                <TableCell>{kpi.leave_type}</TableCell>
                <TableCell>{kpi.total_leave_taken}</TableCell>
                <TableCell>{kpi.remaining_days}</TableCell>
                <TableCell>{kpi.attendance.total_present}</TableCell>
                <TableCell>{kpi.attendance.total_absent}</TableCell>
                <TableCell>{kpi.attendance.total_leave}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default KPI;
