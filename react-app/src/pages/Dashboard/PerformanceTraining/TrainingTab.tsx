// src/pages/TrainingTab.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Link,
  CircularProgress,
  TextField,
  Button,
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

const TrainingTab: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState(""); // search query

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

  useEffect(() => {
    // load all courses initially
    fetchCourses();
  }, []);

  const handleSearch = () => {
    fetchCourses(query);
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
          data-testid="training-search-input"
        />
        <Button variant="contained" onClick={handleSearch} data-testid="training-search-btn">
          Search
        </Button>
      </Box>

      {/* Loading / Error / Empty States */}
      {loading && <CircularProgress data-testid="loading-spinner" />}
      {error && <Typography color="error">{error}</Typography>}
      {!loading && !error && courses.length === 0 && (
        <Typography>No courses found.</Typography>
      )}

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
              }}
              data-testid={`course-${course.courseId}`}
            >
              <Typography variant="h6">{course.title}</Typography>
              <Typography variant="body2" color="textSecondary">
                {course.category} — {course.durationHours} hours
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {course.description}
              </Typography>
              <Link
                href={course.link}
                target="_blank"
                rel="noopener"
                sx={{ mt: 1, display: "inline-block" }}
              >
                Go to course
              </Link>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TrainingTab;
