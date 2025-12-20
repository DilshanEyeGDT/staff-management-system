import React, { useEffect, useState } from "react";
import axiosLaravel from "../../../axiosConfig/axiosLaravel";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/material";
import dayjs from "dayjs";

/* ---------- Interfaces ---------- */

interface Attachment {
  feedback_attachment_id: number;
  file_name: string;
  file_type: string;
}

interface Message {
  feedback_message_id: number;
  sender_id: number;
  message: string;
  created_at: string;
}

interface FeedbackDetails {
  feedback_id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
  messages: Message[];
}

interface User {
  id: number;
  display_name: string;
}

interface Props {
  feedbackId: number | null;
  open: boolean;
  onClose: () => void;
}

const FeedbackDetailsDialog: React.FC<Props> = ({
  feedbackId,
  open,
  onClose,
}) => {
  const [feedback, setFeedback] = useState<FeedbackDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- Helpers ---------- */
  const getUserName = (id: number) => {
    const user = users.find((u) => u.id === id);
    return user ? user.display_name : `User ${id}`;
  };

  /* ---------- Fetch Users ---------- */
  const fetchUsers = async () => {
    try {
      const res = await axiosLaravel.get("/api/v1/users");
      setUsers(res.data.data || []);
    } catch (error) {
      console.error("Error loading users", error);
    }
  };

  /* ---------- Fetch Feedback Details ---------- */
  useEffect(() => {
    if (!feedbackId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await axiosLaravel.get(
          `/api/v1/feedback/${feedbackId}`
        );
        setFeedback(res.data);
      } catch (error) {
        console.error("Error loading feedback details", error);
      }
      setLoading(false);
    };

    fetchUsers();
    fetchDetails();
  }, [feedbackId]);

  return (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    data-testid="feedback-details-dialog"
  >
    <DialogContent dividers data-testid="feedback-details-content">
      {loading || !feedback ? (
        <CircularProgress data-testid="feedback-details-loading" />
      ) : (
        <Box data-testid="feedback-details-container">
          {/* ---------- HEADER ---------- */}
          <Typography
            variant="h6"
            fontWeight={600}
            data-testid="feedback-title"
          >
            {feedback.title}
          </Typography>

          <Box
            sx={{ display: "flex", gap: 1, mt: 1 }}
            data-testid="feedback-meta-chips"
          >
            <Chip
              label={feedback.status}
              color="primary"
              data-testid="feedback-status-chip"
            />
            <Chip
              label={feedback.priority}
              data-testid="feedback-priority-chip"
            />
            <Chip
              label={feedback.category}
              data-testid="feedback-category-chip"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* ---------- ATTACHMENTS ---------- */}
          <Typography
            variant="subtitle1"
            fontWeight={600}
            data-testid="feedback-attachments-title"
          >
            📎 Attachments
          </Typography>

          {feedback.attachments.length === 0 ? (
            <Typography data-testid="feedback-no-attachments">
              No attachments
            </Typography>
          ) : (
            feedback.attachments.map((file, index) => (
              <Typography
                key={file.feedback_attachment_id}
                variant="body2"
                data-testid={`feedback-attachment-${index}`}
              >
                • {file.file_name} ({file.file_type})
              </Typography>
            ))
          )}

          <Divider sx={{ my: 2 }} />

          {/* ---------- MESSAGES ---------- */}
          <Typography
            variant="subtitle1"
            fontWeight={600}
            data-testid="feedback-messages-title"
          >
            💬 Messages
          </Typography>

          {feedback.messages.length === 0 ? (
            <Typography data-testid="feedback-no-messages">
              No messages
            </Typography>
          ) : (
            feedback.messages.map((msg, index) => (
              <Box
                key={msg.feedback_message_id}
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  background: "#f9f9f9",
                }}
                data-testid={`feedback-message-${index}`}
              >
                <Typography
                  fontWeight={600}
                  data-testid={`feedback-message-sender-${index}`}
                >
                  {getUserName(msg.sender_id)}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 0.5 }}
                  data-testid={`feedback-message-text-${index}`}
                >
                  {msg.message}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  data-testid={`feedback-message-date-${index}`}
                >
                  {dayjs(msg.created_at).format("DD MMM YYYY, hh:mm A")}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      )}
    </DialogContent>
  </Dialog>
);

};

export default FeedbackDetailsDialog;
