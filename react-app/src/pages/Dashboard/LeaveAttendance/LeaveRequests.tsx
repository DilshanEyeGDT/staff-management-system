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
import axiosLambda from "../../../axiosConfig/axiosLambda";

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
  <Box id="leave-requests-page" data-testid="leave-requests-page">
    <Typography
      variant="h6"
      sx={{ mb: 2 }}
      id="leave-requests-title"
      data-testid="leave-requests-title"
    >
      Leave Requests
    </Typography>

    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems="center"
      sx={{ mb: 2 }}
      id="leave-requests-filter-section"
      data-testid="leave-requests-filter-section"
    >
      {/* User Dropdown */}
      <FormControl
        sx={{ minWidth: 200 }}
        id="lr-user-select-container"
        data-testid="lr-user-select-container"
      >
        <InputLabel
          id="lr-user-select-label"
          data-testid="lr-user-select-label"
        >
          Select User
        </InputLabel>

        {usersLoading ? (
          <CircularProgress
            size={20}
            id="lr-users-loading-spinner"
            data-testid="lr-users-loading-spinner"
          />
        ) : (
          <Select
            id="lr-user-select"
            data-testid="lr-user-select"
            labelId="lr-user-select-label"
            value={selectedUserId}
            label="Select User"
            onChange={(e) => setSelectedUserId(e.target.value as number)}
            displayEmpty
            MenuProps={{
              PaperProps: {
                id: "lr-user-dropdown-menu",
                "data-testid": "lr-user-dropdown-menu",
              },
            }}
          >
            <MenuItem
              value=""
              id="lr-user-option-empty"
              data-testid="lr-user-option-empty"
            >
              <em> </em>
            </MenuItem>

            {users.map((u) => (
              <MenuItem
                key={u.user_id}
                value={u.user_id}
                id={`lr-user-option-${u.user_id}`}
                data-testid={`lr-user-option-${u.user_id}`}
              >
                {u.display_name}
              </MenuItem>
            ))}
          </Select>
        )}

        {usersError && (
          <Typography
            color="error"
            id="lr-users-error"
            data-testid="lr-users-error"
          >
            {usersError}
          </Typography>
        )}
      </FormControl>

      {/* Status Dropdown */}
      <FormControl
        sx={{ minWidth: 150 }}
        id="lr-status-filter-container"
        data-testid="lr-status-filter-container"
      >
        <InputLabel
          id="lr-status-filter-label"
          data-testid="lr-status-filter-label"
        >
          Status
        </InputLabel>

        <Select
          id="lr-status-filter"
          data-testid="lr-status-filter"
          labelId="lr-status-filter-label"
          value={statusFilter}
          label="Status"
          onChange={(e) => setStatusFilter(e.target.value)}
          MenuProps={{
            PaperProps: {
              id: "lr-status-dropdown-menu",
              "data-testid": "lr-status-dropdown-menu",
            },
          }}
        >
          <MenuItem value="all" id="lr-status-all" data-testid="lr-status-all">
            All
          </MenuItem>
          <MenuItem
            value="pending"
            id="lr-status-pending"
            data-testid="lr-status-pending"
          >
            Pending
          </MenuItem>
          <MenuItem
            value="approved"
            id="lr-status-approved"
            data-testid="lr-status-approved"
          >
            Approved
          </MenuItem>
          <MenuItem
            value="rejected"
            id="lr-status-rejected"
            data-testid="lr-status-rejected"
          >
            Rejected
          </MenuItem>
        </Select>
      </FormControl>

      {/* Start Date */}
      <TextField
        id="lr-start-date"
        data-testid="lr-start-date"
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      {/* End Date */}
      <TextField
        id="lr-end-date"
        data-testid="lr-end-date"
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
        data-testid="lr-loading"
      >
        <CircularProgress
          id="lr-loading-spinner"
          data-testid="lr-loading-spinner"
        />
      </Box>
    ) : error ? (
      <Typography
        color="error"
        id="lr-error"
        data-testid="lr-error"
      >
        {error}
      </Typography>
    ) : !selectedUserId ? (
      <Typography
        id="lr-no-user"
        data-testid="lr-no-user"
      >
        Please select a user to view leave requests.
      </Typography>
    ) : leaveRequests.length === 0 ? (
      <Typography
        id="lr-empty"
        data-testid="lr-empty"
      >
        No leave requests found.
      </Typography>
    ) : (
  <>
    <Table id="lr-table" data-testid="lr-table">
      <TableHead id="lr-table-head" data-testid="lr-table-head">
        <TableRow id="lr-table-head-row" data-testid="lr-table-head-row">
          <TableCell data-testid="lr-col-leave-type">Leave Type</TableCell>
          <TableCell data-testid="lr-col-start-date">Start Date</TableCell>
          <TableCell data-testid="lr-col-end-date">End Date</TableCell>
          <TableCell data-testid="lr-col-total-days">Total Days</TableCell>
          <TableCell data-testid="lr-col-reason">Reason</TableCell>
          <TableCell data-testid="lr-col-status">Status</TableCell>
          <TableCell data-testid="lr-col-actions">Actions</TableCell>
        </TableRow>
      </TableHead>

      <TableBody id="lr-table-body" data-testid="lr-table-body">
        {leaveRequests.map((lr) => (
          <TableRow
            key={lr.leave_request_id}
            id={`lr-row-${lr.leave_request_id}`}
            data-testid={`lr-row-${lr.leave_request_id}`}
          >
            <TableCell
              id={`lr-type-${lr.leave_request_id}`}
              data-testid={`lr-type-${lr.leave_request_id}`}
            >
              {lr.leave_type}
            </TableCell>

            <TableCell
              id={`lr-start-${lr.leave_request_id}`}
              data-testid={`lr-start-${lr.leave_request_id}`}
            >
              {new Date(lr.start_date).toLocaleDateString()}
            </TableCell>

            <TableCell
              id={`lr-end-${lr.leave_request_id}`}
              data-testid={`lr-end-${lr.leave_request_id}`}
            >
              {new Date(lr.end_date).toLocaleDateString()}
            </TableCell>

            <TableCell
              id={`lr-days-${lr.leave_request_id}`}
              data-testid={`lr-days-${lr.leave_request_id}`}
            >
              {lr.total_days}
            </TableCell>

            <TableCell
              id={`lr-reason-${lr.leave_request_id}`}
              data-testid={`lr-reason-${lr.leave_request_id}`}
            >
              {lr.reason}
            </TableCell>

            <TableCell
              id={`lr-status-${lr.leave_request_id}`}
              data-testid={`lr-status-${lr.leave_request_id}`}
            >
              {lr.status}
            </TableCell>

            <TableCell
              id={`lr-actions-${lr.leave_request_id}`}
              data-testid={`lr-actions-${lr.leave_request_id}`}
            >
              <Stack
                direction="row"
                spacing={1}
                data-testid={`lr-actions-stack-${lr.leave_request_id}`}
              >
                <Button
                  id={`lr-approve-btn-${lr.leave_request_id}`}
                  data-testid={`lr-approve-btn-${lr.leave_request_id}`}
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
                  data-testid={`lr-reject-btn-${lr.leave_request_id}`}
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
        data-testid="lr-pagination-section"
      >
        <Pagination
          id="lr-pagination"
          data-testid="lr-pagination"
          count={totalPages}
          page={page}
          onChange={(_e, value) => setPage(value)}
        />
      </Box>
    )}
  </>
)}

{/* Approve / Reject Dialog */}
<Dialog
  id="lr-dialog"
  data-testid="lr-dialog"
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
>
  <DialogTitle
    id="lr-dialog-title"
    data-testid="lr-dialog-title"
  >
    {currentAction === "approved" ? "Approve Leave" : "Reject Leave"}
  </DialogTitle>

  <DialogContent
    id="lr-dialog-content"
    data-testid="lr-dialog-content"
  >
    <TextField
      id="lr-dialog-comment"
      data-testid="lr-dialog-comment"
      autoFocus
      label="Comment"
      fullWidth
      required
      value={comment}
      onChange={(e) => setComment(e.target.value)}
    />
  </DialogContent>

  <DialogActions
    id="lr-dialog-actions"
    data-testid="lr-dialog-actions"
  >
    <Button
      id="lr-dialog-cancel"
      data-testid="lr-dialog-cancel"
      onClick={() => setDialogOpen(false)}
    >
      Cancel
    </Button>

    <Button
      id="lr-dialog-confirm"
      data-testid="lr-dialog-confirm"
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
  data-testid="lr-snackbar"
  open={snackbarOpen}
  autoHideDuration={4000}
  onClose={() => setSnackbarOpen(false)}
  message={snackbarMessage}
/>

    </Box>
  );

};

export default LeaveRequests;
