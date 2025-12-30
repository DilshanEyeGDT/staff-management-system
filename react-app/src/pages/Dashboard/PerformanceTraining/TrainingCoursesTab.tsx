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

const TrainingCoursesTab: React.FC = () => {
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
  <Box
    display="flex"
    flexDirection="column"
    gap={3}
    id="training-course-list"
    data-testid="training-course-list"
  >
    {/* Search Bar */}
    <Box
      display="flex"
      gap={2}
      mb={2}
      id="training-search-bar"
      data-testid="training-search-bar"
    >
      <TextField
        label="Search courses"
        variant="outlined"
        size="small"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        id="training-search-input"
        data-testid="training-search-input"
      />
      <Button
        variant="contained"
        onClick={handleSearch}
        id="training-search-button"
        data-testid="training-search-button"
      >
        Search
      </Button>
    </Box>

    {/* Loading / Error / Empty States */}
    {loading && (
      <CircularProgress
        id="training-loading-spinner"
        data-testid="training-loading-spinner"
      />
    )}

    {error && (
      <Typography
        color="error"
        id="training-error-text"
        data-testid="training-error-text"
      >
        {error}
      </Typography>
    )}

    {!loading && !error && courses.length === 0 && (
      <Typography
        id="training-empty-text"
        data-testid="training-empty-text"
      >
        No courses found.
      </Typography>
    )}

    {/* Course List */}
    {!loading && courses.length > 0 && (
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        id="training-course-list-container"
        data-testid="training-course-list-container"
      >
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
              "&:hover": { transform: "scale(1.01)" },
            }}
            onClick={() => setSelectedCourse(course)}
            id={`training-course-card-${course.courseId}`}
            data-testid={`training-course-card-${course.courseId}`}
          >
            <Typography
              variant="h6"
              id={`training-course-title-${course.courseId}`}
              data-testid={`training-course-title-${course.courseId}`}
            >
              {course.title}
            </Typography>

            <Typography
              variant="body2"
              color="textSecondary"
              id={`training-course-meta-${course.courseId}`}
              data-testid={`training-course-meta-${course.courseId}`}
            >
              {course.category} — {course.durationHours} hours
            </Typography>

            <Typography
              variant="body1"
              sx={{ mt: 1 }}
              id={`training-course-description-${course.courseId}`}
              data-testid={`training-course-description-${course.courseId}`}
            >
              {course.description}
            </Typography>
          </Box>
        ))}
      </Box>
    )}

    {/* Assign Modal */}
    <Dialog
      open={!!selectedCourse}
      onClose={() => setSelectedCourse(null)}
      maxWidth="md"
      fullWidth
      id="assign-course-dialog"
      data-testid="assign-course-dialog"
    >
      <DialogTitle
        id="assign-course-dialog-title"
        data-testid="assign-course-dialog-title"
      >
        Assign Course
      </DialogTitle>

      <DialogContent
        id="assign-course-dialog-content"
        data-testid="assign-course-dialog-content"
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          gap={4}
        >
          {/* Left: Course Details */}
          <Box
            flex={1}
            id="assign-course-details"
            data-testid="assign-course-details"
          >
            <Typography
              variant="h6"
              id="assign-course-title"
              data-testid="assign-course-title"
            >
              {selectedCourse?.title}
            </Typography>

            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ mb: 1 }}
              id="assign-course-meta"
              data-testid="assign-course-meta"
            >
              {selectedCourse?.category} — {selectedCourse?.durationHours} hours
            </Typography>

            <Typography
              variant="body1"
              sx={{ mb: 2 }}
              id="assign-course-description"
              data-testid="assign-course-description"
            >
              {selectedCourse?.description}
            </Typography>

            <Link
              href={selectedCourse?.link}
              target="_blank"
              rel="noopener"
              id="assign-course-link"
              data-testid="assign-course-link"
            >
              Go to course
            </Link>
          </Box>

          {/* Right: Assign Form */}
          <Box
            flex={1}
            display="flex"
            flexDirection="column"
            gap={2}
            id="assign-course-form"
            data-testid="assign-course-form"
          >
            <FormControl fullWidth>
              <InputLabel id="user-select-label">
                Select User
              </InputLabel>
              <Select
                labelId="user-select-label"
                value={selectedUserId}
                label="Select User"
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                id="assign-user-select"
                data-testid="assign-user-select"
              >
                {users.map((user) => (
                  <MenuItem
                    key={user.id}
                    value={user.id}
                    id={`assign-user-option-${user.id}`}
                    data-testid={`assign-user-option-${user.id}`}
                  >
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
              id="assign-due-date-input"
              data-testid="assign-due-date-input"
            />

            <Box
              display="flex"
              gap={2}
              id="assign-course-action-buttons"
              data-testid="assign-course-action-buttons"
            >
              <Button
                variant="contained"
                onClick={handleAssign}
                id="assign-course-submit-button"
                data-testid="assign-course-submit-button"
              >
                Assign Course
              </Button>

              <Button
                variant="outlined"
                onClick={() => setSelectedCourse(null)}
                id="assign-course-cancel-button"
                data-testid="assign-course-cancel-button"
              >
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
      id="training-snackbar"
      data-testid="training-snackbar"
    >
      <Alert
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        sx={{ width: "100%" }}
        id="training-snackbar-alert"
        data-testid="training-snackbar-alert"
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </Box>
);

};

export default TrainingCoursesTab;
