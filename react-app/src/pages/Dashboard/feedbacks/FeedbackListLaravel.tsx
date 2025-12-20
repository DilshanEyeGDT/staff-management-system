import React, { useEffect, useState } from "react";
import axiosLaravel from "../../../axiosConfig/axiosLaravel";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Snackbar,
  Alert,
  Fab,
  Button,
} from "@mui/material";
import FeedbackDetailsDialog from "./FeedbackDetailsLaravel";
import AddCommentDialog from "./AddCommentDialog";
import AddFeedbackDialog from "./AddFeedbackDialog";
import EditFeedbackDialog from "./EditFeedbackDialog";

interface FeedbackItem {
  feedback_id: number;
  user_id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  assignee_id: number;
}

interface User {
  id: number;
  display_name: string;
}

const FeedbackListLaravel: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");

  // Dialog states
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [commentOpen, setCommentOpen] = useState(false);
  const [commentFeedbackId, setCommentFeedbackId] = useState<number | null>(null);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // Edit dialog state
const [editOpen, setEditOpen] = useState(false);
const [editFeedback, setEditFeedback] = useState<FeedbackItem | null>(null);

  const handleShowSnackbar = (msg: string, severity: "success" | "error") => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  //floating button
  const [addOpen, setAddOpen] = useState(false);

  const getUserName = (id: number) => {
    const user = users.find((u) => u.id === id);
    return user ? user.display_name : `User ${id}`;
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, size: 5 };
      if (status) params.status = status;
      if (assignee) params.assignee = assignee;

      const res = await axiosLaravel.get("/api/v1/feedback", { params });
      setFeedbacks(res.data.data || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      handleShowSnackbar("Failed to load feedbacks", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosLaravel.get("/api/v1/users");
      setUsers(res.data.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      handleShowSnackbar("Failed to load users", "error");
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchFeedbacks(); }, [status, assignee]);

  return (
  <Box sx={{ mt: 4, p: 2 }} data-testid="feedback-page-container">
    {/* Filters */}
    <Paper sx={{ p: 2, mb: 3 }} data-testid="feedback-filters-panel">
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }} data-testid="feedback-filters-container">
        <FormControl sx={{ minWidth: 150 }} data-testid="filter-status-control">
          <InputLabel data-testid="filter-status-label">Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
            data-testid="filter-status-select"
          >
            <MenuItem value="" data-testid="filter-status-all">All</MenuItem>
            <MenuItem value="open" data-testid="filter-status-open">Open</MenuItem>
            <MenuItem value="in_progress" data-testid="filter-status-in-progress">In Progress</MenuItem>
            <MenuItem value="closed" data-testid="filter-status-closed">Closed</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }} data-testid="filter-assignee-control">
          <InputLabel data-testid="filter-assignee-label">Assignee</InputLabel>
          <Select
            value={assignee}
            label="Assignee"
            onChange={(e) => setAssignee(e.target.value)}
            data-testid="filter-assignee-select"
          >
            <MenuItem value="" data-testid="filter-assignee-all">All</MenuItem>
            {users.map((user) => (
              <MenuItem
                key={user.id}
                value={user.id}
                data-testid={`filter-assignee-option-${user.id}`}
              >
                {user.display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>

    {/* Feedback List */}
    {loading ? (
      <CircularProgress data-testid="feedback-loading-indicator" />
    ) : (
      <Box data-testid="feedback-list-container">
        {feedbacks.length === 0 ? (
          <Typography data-testid="feedback-empty-state">
            No feedbacks found.
          </Typography>
        ) : (
          feedbacks.map((fb) => (
            <Paper
              key={fb.feedback_id}
              data-testid={`feedback-card-${fb.feedback_id}`}
              onClick={() => {
                setSelectedFeedbackId(fb.feedback_id);
                setDetailsOpen(true);
              }}
              sx={{
                p: 2.5,
                mb: 2,
                borderRadius: 2,
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                },
              }}
            >
              {/* Header */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}
                data-testid={`feedback-header-${fb.feedback_id}`}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  data-testid={`feedback-title-${fb.feedback_id}`}
                >
                  {fb.title}
                </Typography>
                <Box
                  data-testid={`feedback-status-${fb.feedback_id}`}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    backgroundColor:
                      fb.status === "open"
                        ? "#e3f2fd"
                        : fb.status === "in_progress"
                        ? "#fff8e1"
                        : "#e8f5e9",
                    color:
                      fb.status === "open"
                        ? "#1565c0"
                        : fb.status === "in_progress"
                        ? "#f57f17"
                        : "#2e7d32",
                  }}
                >
                  {fb.status.replace("_", " ")}
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} data-testid={`feedback-divider-${fb.feedback_id}`} />

              {/* Details */}
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}
                data-testid={`feedback-details-${fb.feedback_id}`}
              >
                <Typography
                  variant="body2"
                  data-testid={`feedback-category-${fb.feedback_id}`}
                >
                  <b>Category:</b> {fb.category}
                </Typography>

                <Typography
                  variant="body2"
                  data-testid={`feedback-priority-${fb.feedback_id}`}
                >
                  <b>Priority:</b>{" "}
                  <span
                    data-testid={`feedback-priority-badge-${fb.feedback_id}`}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor:
                        fb.priority === "high"
                          ? "#ffebee"
                          : fb.priority === "medium"
                          ? "#fffde7"
                          : "#e8f5e9",
                      color:
                        fb.priority === "high"
                          ? "#c62828"
                          : fb.priority === "medium"
                          ? "#f9a825"
                          : "#2e7d32",
                    }}
                  >
                    {fb.priority}
                  </span>
                </Typography>

                <Typography
                  variant="body2"
                  data-testid={`feedback-created-by-${fb.feedback_id}`}
                >
                  <b>Created by:</b> {getUserName(fb.user_id)}
                </Typography>

                <Typography
                  variant="body2"
                  data-testid={`feedback-assignee-${fb.feedback_id}`}
                >
                  <b>Assignee:</b> {getUserName(fb.assignee_id)}
                </Typography>
              </Box>

              {/* Actions */}
              <Box
                sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "flex-end" }}
                data-testid={`feedback-actions-${fb.feedback_id}`}
              >
                <Box
                  data-testid={`feedback-edit-button-${fb.feedback_id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditFeedback(fb);
                    setEditOpen(true);
                  }}
                  sx={{
                    px: 2,
                    py: 0.6,
                    borderRadius: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1565c0",
                    border: "1px solid #1565c0",
                    "&:hover": { backgroundColor: "#e3f2fd" },
                  }}
                >
                  Edit
                </Box>

                <Box
                  data-testid={`feedback-add-comment-button-${fb.feedback_id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCommentFeedbackId(fb.feedback_id);
                    setCommentOpen(true);
                  }}
                  sx={{
                    px: 2,
                    py: 0.6,
                    borderRadius: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#2e7d32",
                    border: "1px solid #2e7d32",
                    "&:hover": { backgroundColor: "#e8f5e9" },
                  }}
                >
                  Add Comment
                </Box>
              </Box>
            </Paper>
          ))
        )}

        {/* Dialogs */}
        <FeedbackDetailsDialog
          open={detailsOpen}
          feedbackId={selectedFeedbackId}
          onClose={() => setDetailsOpen(false)}
          data-testid="feedback-details-dialog"
        />

        <AddCommentDialog
          open={commentOpen}
          feedbackId={commentFeedbackId}
          onClose={() => setCommentOpen(false)}
          onSuccess={fetchFeedbacks}
          onShowSnackbar={handleShowSnackbar}
          data-testid="add-comment-dialog"
        />

        <EditFeedbackDialog
          open={editOpen}
          feedbackId={editFeedback?.feedback_id ?? null}
          currentStatus={editFeedback?.status ?? "open"}
          currentPriority={editFeedback?.priority ?? "low"}
          currentAssigneeId={editFeedback?.assignee_id ?? 0}
          users={users}
          onClose={() => {
            setEditOpen(false);
            setEditFeedback(null);
          }}
          onSuccess={fetchFeedbacks}
          onShowSnackbar={handleShowSnackbar}
          data-testid="edit-feedback-dialog"
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          data-testid="feedback-snackbar"
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
            data-testid="feedback-snackbar-alert"
          >
            {snackbarMsg}
          </Alert>
        </Snackbar>

        {/* Floating Add Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddOpen(true)}
          data-testid="add-feedback-floating-button"
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            width: 60,
            height: 60,
            borderRadius: "50%",
            fontSize: 32,
            minWidth: 0,
          }}
        >
          +
        </Button>

        <AddFeedbackDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSuccess={fetchFeedbacks}
          onShowSnackbar={handleShowSnackbar}
          data-testid="add-feedback-dialog"
        />
      </Box>
    )}
  </Box>
);

};

export default FeedbackListLaravel;
