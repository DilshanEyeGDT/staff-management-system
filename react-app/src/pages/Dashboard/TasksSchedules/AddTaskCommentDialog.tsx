// src/components/tasks/AddTaskCommentDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import axiosInstance from "../../../axiosConfig/axiosConfig"; // for current user ID
import axiosNet from "../../../axiosConfig/axiosNet"; // .NET endpoints

interface Props {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
}

const AddTaskCommentDialog: React.FC<Props> = ({ taskId, open, onClose }) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axiosInstance.get("/me");
        setCurrentUserId(res.data.id);
      } catch (err) {
        console.error("Failed to fetch current user", err);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleSubmit = async () => {
    if (!taskId || !comment || !currentUserId) return;

    setLoading(true);
    try {
      await axiosNet.post(`/v1/tasks/${taskId}/comments`, {
        createdByUserId: currentUserId,
        content: comment,
      });

      setSnackbarMsg("Comment added successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setComment(""); // reset
      onClose();
    } catch (err) {
      console.error(err);
      setSnackbarMsg("Failed to add comment!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="add-task-comment-dialog"
    >
      <DialogTitle data-testid="add-task-comment-title">
        Add Comment
      </DialogTitle>

      <DialogContent data-testid="add-task-comment-content">
        <TextField
          label="Comment"
          multiline
          rows={4}
          fullWidth
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{ mt: 1 }}
          data-testid="add-task-comment-input"
        />
      </DialogContent>

      <DialogActions data-testid="add-task-comment-actions">
        <Button
          onClick={onClose}
          disabled={loading}
          data-testid="add-task-comment-cancel-button"
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="add-task-comment-submit-button"
        >
          {loading ? (
            <CircularProgress size={20} data-testid="add-task-comment-loading" />
          ) : (
            "Add"
          )}
        </Button>
      </DialogActions>
    </Dialog>

    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      data-testid="add-task-comment-snackbar"
    >
      <Alert
        onClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
        sx={{ width: "100%" }}
        data-testid="add-task-comment-snackbar-alert"
      >
        {snackbarMsg}
      </Alert>
    </Snackbar>
  </>
);

};

export default AddTaskCommentDialog;
