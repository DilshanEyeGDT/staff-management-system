import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Pagination,
} from "@mui/material";
import axiosLambda from "../../../axiosLambda";

type User = {
  user_id: number;
  display_name: string;
};

type LeaveRequest = {
  leave_request_id: number;
  display_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approver_name?: string | null;
  approved_at?: string | null;
};

const DEFAULT_PAGE_SIZE = 5;

const LeaveRequests: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [size] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<"approved" | "rejected" | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fetch users for dropdown
  useEffect(() => {
    setUsersLoading(true);
    axiosLambda
      .get("/api/v1/users")
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setUsersError(err?.response?.data?.message || "Failed to load users");
      })
      .finally(() => setUsersLoading(false));
  }, []);

  const fetchLeaveRequests = () => {
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);

    const params: any = {
      user_id: selectedUserId,
      page,
      size,
    };
    if (statusFilter !== "all") params.status = statusFilter;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    axiosLambda
      .get("/api/v1/leave/requests", { params })
      .then((res) => {
        const data = res.data?.data;
        setLeaveRequests(data?.leaveRequests || []);
        const pagination = data?.pagination;
        setTotalPages(pagination ? Math.max(1, Math.ceil(pagination.total / pagination.size)) : 1);
      })
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to fetch leave requests");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchLeaveRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, statusFilter, startDate, endDate, page]);

  const openDialog = (requestId: number, action: "approved" | "rejected") => {
    setCurrentRequestId(requestId);
    setCurrentAction(action);
    setComment("");
    setDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!currentRequestId || !currentAction) return;

    axiosLambda
      .patch(`/api/v1/leave/requests?id=${currentRequestId}`, {
        status: currentAction,
        comment,
      })
      .then(() => {
        setSnackbarMessage(`Leave request ${currentAction} successfully`);
        setSnackbarOpen(true);
        setLeaveRequests((prev) =>
          prev.map((lr) =>
            lr.leave_request_id === currentRequestId ? { ...lr, status: currentAction } : lr
          )
        );
      })
      .catch((err) => {
        console.error(err);
        setSnackbarMessage(err?.response?.data?.message || "Failed to update leave request");
        setSnackbarOpen(true);
      })
      .finally(() => setDialogOpen(false));
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Leave Requests
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
                <em> </em>
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

        {/* Status Dropdown */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
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
      ) : !selectedUserId ? (
        <Typography>Please select a user to view leave requests.</Typography>
      ) : leaveRequests.length === 0 ? (
        <Typography>No leave requests found.</Typography>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Leave Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveRequests.map((lr) => (
                <TableRow key={lr.leave_request_id}>
                  <TableCell>{lr.leave_type}</TableCell>
                  <TableCell>{new Date(lr.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(lr.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{lr.total_days}</TableCell>
                  <TableCell>{lr.reason}</TableCell>
                  <TableCell>{lr.status}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={lr.status !== "pending"}
                        onClick={() => openDialog(lr.leave_request_id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={lr.status !== "pending"}
                        onClick={() => openDialog(lr.leave_request_id, "rejected")}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination count={totalPages} page={page} onChange={(_e, value) => setPage(value)} />
            </Box>
          )}
        </>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{currentAction === "approved" ? "Approve Leave" : "Reject Leave"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Comment"
            fullWidth
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={currentAction === "approved" ? "success" : "error"}
            onClick={handleConfirmAction}
            disabled={!comment.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

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

export default LeaveRequests;
