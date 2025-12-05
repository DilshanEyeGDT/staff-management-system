// src/pages/schedules/ScheduleImportPage.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";

const ScheduleImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload CSV
  const handleUpload = async () => {
    if (!file) {
      setSnackbarMsg("Please select a CSV file first");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axiosNet.post("/v1/imports/schedules", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setJobId(res.data.jobId);
      setStatus("Pending");
      setSnackbarMsg("File uploaded successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbarMsg("Failed to upload file!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Check job status
  const handleCheckStatus = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const res = await axiosNet.get(`/v1/imports/schedules/${jobId}`);
      setStatus(res.data.status);
    } catch (err) {
      console.error(err);
      setSnackbarMsg("Failed to fetch job status!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3} id="import-schedules-container">
      {/* File Input */}
      <label htmlFor="csv-file-input" id="csv-file-label">
        Select a CSV file
      </label>
      <br />
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ marginBottom: "16px" }}
        id="csv-file-input"
      />

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={2} id="import-buttons-box">
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={loading || !file}
          id="upload-csv-button"
        >
          {loading ? <CircularProgress size={20} id="upload-loading-spinner" /> : "Upload CSV"}
        </Button>

        <Button
          variant="outlined"
          onClick={handleCheckStatus}
          disabled={loading || !jobId}
          id="check-status-button"
        >
          Check Status
        </Button>
      </Box>

      {/* Job Status Display */}
      {jobId && (
        <Typography id="job-status-text">
          <strong>Job ID:</strong> <span id="job-id">{jobId}</span> <br />
          <strong>Status:</strong> <span id="job-status">{status}</span>
        </Typography>
      )}

      {/* Snackbar Alerts */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        id="import-snackbar"
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          id="import-snackbar-alert"
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );

};

export default ScheduleImportPage;
