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
} from "@mui/material";

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

  const getUserName = (id: number) => {
    const user = users.find((u) => u.id === id);
    return user ? user.display_name : `User ${id}`;
  };

  const fetchFeedbacks = async () => {
    setLoading(true);

    try {
      const params: any = {
        page: 1,
        size: 5,
      };

      if (status) params.status = status;
      if (assignee) params.assignee = assignee;

      const res = await axiosLaravel.get("/api/v1/feedback", { params });
      setFeedbacks(res.data.data || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
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
    }
  };

  // Load users once
  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔥 AUTO-REFRESH when filters change
  useEffect(() => {
    fetchFeedbacks();
  }, [status, assignee]);

  return (
    <Box sx={{ mt: 4, p: 2 }}>
      {/* ---------- FILTERS ---------- */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {/* Status Filter */}
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>

          {/* Assignee Filter */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Assignee</InputLabel>
            <Select
              value={assignee}
              label="Assignee"
              onChange={(e) => setAssignee(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.display_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* ---------- DATA LIST ---------- */}
      {loading ? (
        <CircularProgress />
      ) : (
        <Box>
          {feedbacks.length === 0 ? (
            <Typography>No feedbacks found.</Typography>
          ) : (
            feedbacks.map((fb) => (
                <Paper
                    key={fb.feedback_id}
                    sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                    }}
                >
                    {/* ---------- HEADER ---------- */}
                    <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                    }}
                    >
                    <Typography variant="h6" fontWeight={600}>
                        {fb.title}
                    </Typography>

                    <Box
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

                    <Divider sx={{ my: 1.5 }} />

                    {/* ---------- DETAILS ---------- */}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                    <Typography variant="body2">
                        <b>Category:</b> {fb.category}
                    </Typography>

                    <Typography variant="body2">
                        <b>Priority:</b>{" "}
                        <span
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

                    <Typography variant="body2">
                        <b>Created by:</b> {getUserName(fb.user_id)}
                    </Typography>

                    <Typography variant="body2">
                        <b>Assignee:</b> {getUserName(fb.assignee_id)}
                    </Typography>
                    </Box>
                </Paper>
                )) 

          )}
        </Box>
      )}
    </Box>
  );
};

export default FeedbackListLaravel;
