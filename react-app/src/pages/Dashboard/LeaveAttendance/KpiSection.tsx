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
import axiosLambda from "../../../axiosConfig/axiosLambda";

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
  <Box id="kpi-page" data-testid="kpi-page">
    <Typography
      variant="h6"
      sx={{ mb: 2 }}
      id="kpi-title"
      data-testid="kpi-title"
    >
      KPI - Leave & Attendance Summary
    </Typography>

    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems="center"
      sx={{ mb: 2 }}
      id="kpi-filter-section"
      data-testid="kpi-filter-section"
    >
      {/* User Dropdown */}
      <FormControl
        sx={{ minWidth: 200 }}
        id="kpi-user-select-container"
        data-testid="kpi-user-select-container"
      >
        <InputLabel
          id="kpi-user-select-label"
          data-testid="kpi-user-select-label"
        >
          Select User
        </InputLabel>

        {usersLoading ? (
          <CircularProgress
            size={20}
            id="kpi-users-loading-spinner"
            data-testid="kpi-users-loading-spinner"
          />
        ) : (
          <Select
            id="kpi-user-select"
            data-testid="kpi-user-select"
            labelId="kpi-user-select-label"
            value={selectedUserId}
            label="Select User"
            onChange={(e) => setSelectedUserId(e.target.value as number)}
            displayEmpty
            MenuProps={{
              PaperProps: {
                id: "kpi-user-dropdown-menu",
                "data-testid": "kpi-user-dropdown-menu",
              },
            }}
          >
            <MenuItem
              value=""
              id="kpi-user-select-empty"
              data-testid="kpi-user-select-empty"
            >
              <em></em>
            </MenuItem>

            {users.map((u) => (
              <MenuItem
                key={u.user_id}
                value={u.user_id}
                id={`kpi-user-option-${u.user_id}`}
                data-testid={`kpi-user-option-${u.user_id}`}
              >
                {u.display_name}
              </MenuItem>
            ))}
          </Select>
        )}

        {usersError && (
          <Typography
            color="error"
            id="kpi-users-error"
            data-testid="kpi-users-error"
          >
            {usersError}
          </Typography>
        )}
      </FormControl>

      {/* Start Date */}
      <TextField
        id="kpi-start-date"
        data-testid="kpi-start-date"
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      {/* End Date */}
      <TextField
        id="kpi-end-date"
        data-testid="kpi-end-date"
        label="End Date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    </Stack>

    {/* Results Section */}
    {loading ? (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={6}
        id="kpi-loading"
        data-testid="kpi-loading"
      >
        <CircularProgress
          id="kpi-loading-spinner"
          data-testid="kpi-loading-spinner"
        />
      </Box>
    ) : error ? (
      <Typography
        color="error"
        id="kpi-error"
        data-testid="kpi-error"
      >
        {error}
      </Typography>
    ) : !selectedUserId || !startDate || !endDate ? (
      <Typography
        id="kpi-missing-filters"
        data-testid="kpi-missing-filters"
      >
        Please select user, start date, and end date to view KPI.
      </Typography>
    ) : kpiData.length === 0 ? (
      <Typography
        id="kpi-no-data"
        data-testid="kpi-no-data"
      >
        No KPI data found.
      </Typography>
    ) : (
      <Table id="kpi-table" data-testid="kpi-table">
        <TableHead id="kpi-table-head" data-testid="kpi-table-head">
          <TableRow
            id="kpi-table-head-row"
            data-testid="kpi-table-head-row"
          >
            <TableCell data-testid="kpi-col-leave-type">
              Leave Type
            </TableCell>
            <TableCell data-testid="kpi-col-total-leave-taken">
              Total Leave Taken
            </TableCell>
            <TableCell data-testid="kpi-col-remaining-days">
              Remaining Days
            </TableCell>
            <TableCell data-testid="kpi-col-total-present">
              Total Present
            </TableCell>
            <TableCell data-testid="kpi-col-total-absent">
              Total Absent
            </TableCell>
            <TableCell data-testid="kpi-col-total-leave">
              Total Leave
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody
          id="kpi-table-body"
          data-testid="kpi-table-body"
        >
          {kpiData.map((kpi, index) => (
            <TableRow
              key={index}
              id={`kpi-row-${index}`}
              data-testid={`kpi-row-${index}`}
            >
              <TableCell
                id={`kpi-leave-type-${index}`}
                data-testid={`kpi-leave-type-${index}`}
              >
                {kpi.leave_type}
              </TableCell>
              <TableCell
                id={`kpi-total-taken-${index}`}
                data-testid={`kpi-total-taken-${index}`}
              >
                {kpi.total_leave_taken}
              </TableCell>
              <TableCell
                id={`kpi-remaining-${index}`}
                data-testid={`kpi-remaining-${index}`}
              >
                {kpi.remaining_days}
              </TableCell>
              <TableCell
                id={`kpi-total-present-${index}`}
                data-testid={`kpi-total-present-${index}`}
              >
                {kpi.attendance.total_present}
              </TableCell>
              <TableCell
                id={`kpi-total-absent-${index}`}
                data-testid={`kpi-total-absent-${index}`}
              >
                {kpi.attendance.total_absent}
              </TableCell>
              <TableCell
                id={`kpi-total-leave-${index}`}
                data-testid={`kpi-total-leave-${index}`}
              >
                {kpi.attendance.total_leave}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}

    {/* Snackbar */}
    <Snackbar
      id="kpi-snackbar"
      data-testid="kpi-snackbar"
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={() => setSnackbarOpen(false)}
      message={snackbarMessage}
    />
  </Box>
);


};

export default KPI;
