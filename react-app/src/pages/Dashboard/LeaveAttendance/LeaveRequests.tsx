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
    <Box id="leave-requests-page">
      <Typography variant="h6" sx={{ mb: 2 }} id="leave-requests-title">
        Leave Requests
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        sx={{ mb: 2 }}
        id="leave-requests-filter-section"
      >
        {/* User Dropdown */}
        <FormControl sx={{ minWidth: 200 }} id="lr-user-select-container">
          <InputLabel id="lr-user-select-label">Select User</InputLabel>

          {usersLoading ? (
            <CircularProgress size={20} id="lr-users-loading-spinner" />
          ) : (
            <Select
              id="lr-user-select"
              labelId="lr-user-select-label"
              value={selectedUserId}
              label="Select User"
              onChange={(e) => setSelectedUserId(e.target.value as number)}
              displayEmpty
            >
              <MenuItem value="" id="lr-user-option-empty">
                <em> </em>
              </MenuItem>

              {users.map((u) => (
                <MenuItem
                  key={u.user_id}
                  value={u.user_id}
                  id={`lr-user-option-${u.user_id}`}
                >
                  {u.display_name}
                </MenuItem>
              ))}
            </Select>
          )}

          {usersError && (
            <Typography color="error" id="lr-users-error">
              {usersError}
            </Typography>
          )}
        </FormControl>

        {/* Status Dropdown */}
        <FormControl sx={{ minWidth: 150 }} id="lr-status-filter-container">
          <InputLabel id="lr-status-filter-label">Status</InputLabel>

          <Select
            id="lr-status-filter"
            labelId="lr-status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all" id="lr-status-all">All</MenuItem>
            <MenuItem value="pending" id="lr-status-pending">Pending</MenuItem>
            <MenuItem value="approved" id="lr-status-approved">Approved</MenuItem>
            <MenuItem value="rejected" id="lr-status-rejected">Rejected</MenuItem>
          </Select>
        </FormControl>

        {/* Start Date */}
        <TextField
          id="lr-start-date"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        {/* End Date */}
        <TextField
          id="lr-end-date"
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
          id="lr-loading"
        >
          <CircularProgress id="lr-loading-spinner" />
        </Box>
      ) : error ? (
        <Typography color="error" id="lr-error">{error}</Typography>
      ) : !selectedUserId ? (
        <Typography id="lr-no-user">Please select a user to view leave requests.</Typography>
      ) : leaveRequests.length === 0 ? (
        <Typography id="lr-empty">No leave requests found.</Typography>
      ) : (
        <>
          <Table id="lr-table">
            <TableHead id="lr-table-head">
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

            <TableBody id="lr-table-body">
              {leaveRequests.map((lr) => (
                <TableRow
                  key={lr.leave_request_id}
                  id={`lr-row-${lr.leave_request_id}`}
                >
                  <TableCell id={`lr-type-${lr.leave_request_id}`}>
                    {lr.leave_type}
                  </TableCell>

                  <TableCell id={`lr-start-${lr.leave_request_id}`}>
                    {new Date(lr.start_date).toLocaleDateString()}
                  </TableCell>

                  <TableCell id={`lr-end-${lr.leave_request_id}`}>
                    {new Date(lr.end_date).toLocaleDateString()}
                  </TableCell>

                  <TableCell id={`lr-days-${lr.leave_request_id}`}>
                    {lr.total_days}
                  </TableCell>

                  <TableCell id={`lr-reason-${lr.leave_request_id}`}>
                    {lr.reason}
                  </TableCell>

                  <TableCell id={`lr-status-${lr.leave_request_id}`}>
                    {lr.status}
                  </TableCell>

                  <TableCell id={`lr-actions-${lr.leave_request_id}`}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        id={`lr-approve-btn-${lr.leave_request_id}`}
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={lr.status !== "pending"}
                        onClick={() =>
                          openDialog(lr.leave_request_id, "approved")
                        }
                      >
                        Approve
                      </Button>

                      <Button
                        id={`lr-reject-btn-${lr.leave_request_id}`}
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={lr.status !== "pending"}
                        onClick={() =>
                          openDialog(lr.leave_request_id, "rejected")
                        }
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
            <Box
              display="flex"
              justifyContent="center"
              mt={2}
              id="lr-pagination-section"
            >
              <Pagination
                id="lr-pagination"
                count={totalPages}
                page={page}
                onChange={(_e, value) => setPage(value)}
              />
            </Box>
          )}
        </>
      )}

      {/* Approve/Reject Dialog */}
      <Dialog
        id="lr-dialog"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle id="lr-dialog-title">
          {currentAction === "approved" ? "Approve Leave" : "Reject Leave"}
        </DialogTitle>

        <DialogContent id="lr-dialog-content">
          <TextField
            id="lr-dialog-comment"
            autoFocus
            label="Comment"
            fullWidth
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>

        <DialogActions id="lr-dialog-actions">
          <Button id="lr-dialog-cancel" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            id="lr-dialog-confirm"
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
        id="lr-snackbar"
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );

};

export default LeaveRequests;
