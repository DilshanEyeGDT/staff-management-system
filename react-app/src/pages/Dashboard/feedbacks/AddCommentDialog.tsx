import React, { useEffect, useState } from "react";
import axiosLaravel from "../../../axiosConfig/axiosLaravel";
import axiosAuth from "../../../axiosConfig/axiosConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

interface Props {
  open: boolean;
  feedbackId: number | null;
  onClose: () => void;
  onSuccess: () => void;
  onShowSnackbar: (message: string, severity: "success" | "error") => void;
}

const AddCommentDialog: React.FC<Props> = ({
  open,
  feedbackId,
  onClose,
  onSuccess,
  onShowSnackbar,
}) => {
  const [message, setMessage] = useState("");
  const [senderId, setSenderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch current user once
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosAuth.get("/me");
        setSenderId(res.data.id);
      } catch (err) {
        console.error("Failed to load current user", err);
        onShowSnackbar("Failed to get current user", "error");
      }
    };
    fetchMe();
  }, [onShowSnackbar]);

  const handleSubmit = async () => {
    if (!feedbackId || !senderId || !message.trim()) return;

    setLoading(true);
    try {
      await axiosLaravel.post(`/api/v1/feedback/${feedbackId}/messages`, {
        sender_id: senderId,
        message,
      });

      setMessage("");
      onSuccess();
      onClose();
      onShowSnackbar("Comment added successfully!", "success");
    } catch (error) {
      console.error("Failed to add comment", error);
      onShowSnackbar("Failed to add comment. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="add-comment-dialog"
    >
      <DialogTitle data-testid="add-comment-dialog-title">Add Comment</DialogTitle>

      <DialogContent>
        <TextField
          multiline
          minRows={4}
          fullWidth
          label="Comment"
          placeholder="Write your comment here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mt: 1 }}
          data-testid="add-comment-textfield"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} data-testid="add-comment-cancel-button">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !message.trim()}
          data-testid="add-comment-submit-button"
        >
          {loading ? <CircularProgress size={20} data-testid="add-comment-loading-indicator" /> : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );

};

export default AddCommentDialog;
