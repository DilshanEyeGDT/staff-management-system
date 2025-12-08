import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Link,
  CircularProgress,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";

interface Course {
  courseId: number;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  link: string;
  createdAt: string;
}

interface User {
  id: number;
  displayName: string;
}

const TrainingTab: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch courses
  const fetchCourses = async (searchQuery = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosNet.get("/v1/training/courses", {
        params: { query: searchQuery, page: 1, size: 10 },
      });
      setCourses(response.data.courses);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await axiosNet.get("/v1/users");
      setUsers(response.data);
    } catch (err: any) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchUsers();
  }, []);

  const handleSearch = () => {
    fetchCourses(query);
  };

  const handleAssign = async () => {
    if (!selectedCourse || !selectedUserId || !dueDate) {
      setSnackbar({ open: true, message: "Please select a user and due date", severity: "error" });
      return;
    }

    try {
      await axiosNet.post("/v1/training/assign", {
        courseId: selectedCourse.courseId,
        userId: selectedUserId,
        dueDate,
      });

      setSnackbar({
        open: true,
        message: `"${selectedCourse.title}" assigned to "${users.find(u => u.id === selectedUserId)?.displayName}"`,
        severity: "success",
      });

      // Reset form
      setSelectedCourse(null);
      setSelectedUserId("");
      setDueDate("");
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to assign course",
        severity: "error",
      });
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3} id="training-course-list">
      {/* Search Bar */}
      <Box display="flex" gap={2} mb={2} id="training-search-bar">
        <TextField
          label="Search courses"
          variant="outlined"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {/* Loading / Error / Empty States */}
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && courses.length === 0 && <Typography>No courses found.</Typography>}

      {/* Course List */}
      {!loading && courses.length > 0 && (
        <Box display="flex" flexDirection="column" gap={2}>
          {courses.map((course) => (
            <Box
              key={course.courseId}
              p={2}
              sx={{
                border: "1px solid #ccc",
                borderRadius: 2,
                backgroundColor: "#f9f9f9",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": { transform: "scale(1.01)"},
              }}
              onClick={() => setSelectedCourse(course)}
            >
              <Typography variant="h6">{course.title}</Typography>
              <Typography variant="body2" color="textSecondary">
                {course.category} — {course.durationHours} hours
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {course.description}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Assign Modal */}
        <Dialog open={!!selectedCourse} onClose={() => setSelectedCourse(null)} maxWidth="md" fullWidth>
        <DialogTitle>Assign Course</DialogTitle>
        <DialogContent>
            <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            gap={4}
            >
            {/* Left: Course Details */}
            <Box flex={1}>
                <Typography variant="h6">{selectedCourse?.title}</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {selectedCourse?.category} — {selectedCourse?.durationHours} hours
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedCourse?.description}
                </Typography>
                <Link href={selectedCourse?.link} target="_blank" rel="noopener">
                Go to course
                </Link>
            </Box>

            {/* Right: Assign Form */}
            <Box flex={1} display="flex" flexDirection="column" gap={2}>
                <FormControl fullWidth>
                <InputLabel id="user-select-label">Select User</InputLabel>
                <Select
                    labelId="user-select-label"
                    value={selectedUserId}
                    label="Select User"
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                >
                    {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                        {user.displayName}
                    </MenuItem>
                    ))}
                </Select>
                </FormControl>

                <TextField
                label="Due Date"
                type="date"
                fullWidth
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                />

                <Box display="flex" gap={2}>
                <Button variant="contained" onClick={handleAssign}>
                    Assign Course
                </Button>
                <Button variant="outlined" onClick={() => setSelectedCourse(null)}>
                    Cancel
                </Button>
                </Box>
            </Box>
            </Box>
        </DialogContent>
        </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainingTab;
