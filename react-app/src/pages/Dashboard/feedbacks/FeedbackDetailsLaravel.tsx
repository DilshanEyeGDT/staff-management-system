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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent dividers>
        {loading || !feedback ? (
          <CircularProgress />
        ) : (
          <Box>
            {/* ---------- HEADER ---------- */}
            <Typography variant="h6" fontWeight={600}>
              {feedback.title}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Chip label={feedback.status} color="primary" />
              <Chip label={feedback.priority} />
              <Chip label={feedback.category} />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* ---------- ATTACHMENTS ---------- */}
            <Typography variant="subtitle1" fontWeight={600}>
              📎 Attachments
            </Typography>

            {feedback.attachments.length === 0 ? (
              <Typography>No attachments</Typography>
            ) : (
              feedback.attachments.map((file) => (
                <Typography
                  key={file.feedback_attachment_id}
                  variant="body2"
                >
                  • {file.file_name} ({file.file_type})
                </Typography>
              ))
            )}

            <Divider sx={{ my: 2 }} />

            {/* ---------- MESSAGES ---------- */}
            <Typography variant="subtitle1" fontWeight={600}>
              💬 Messages
            </Typography>

            {feedback.messages.length === 0 ? (
              <Typography>No messages</Typography>
            ) : (
              feedback.messages.map((msg) => (
                <Box
                  key={msg.feedback_message_id}
                  sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 1,
                    background: "#f9f9f9",
                  }}
                >
                  <Typography fontWeight={600}>
                    {getUserName(msg.sender_id)}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {msg.message}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {/* {msg.created_at} */}
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
