import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";

export default function KpiActualsImport() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobResult, setJobResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setSnackbar({ open: true, message: "Please select a file", severity: "error" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await axiosNet.post("/v1/perf/actuals/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const jobIdResponse = response.data.jobId;
      setJobId(jobIdResponse);
      setJobStatus("Queued");
      setSnackbar({ open: true, message: "File uploaded successfully, job queued", severity: "success" });

      // Start polling
      pollJobStatus(jobIdResponse);
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.message || "Upload failed", severity: "error" });
      setLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const interval = setInterval(async () => {
        try {
          const response = await axiosNet.get(`/v1/imports/${jobId}`);
          setJobStatus(response.data.status);
          setJobResult(response.data.result || "");

          if (response.data.status === "Completed" || response.data.status === "Failed") {
            clearInterval(interval);
            setLoading(false);
            setSnackbar({ open: true, message: response.data.result || "Job completed", severity: "success" });
          }
        } catch (err) {
          console.error("Failed to fetch job status", err);
          clearInterval(interval);
          setLoading(false);
        }
      }, 2000); // Poll every 2 seconds
    } catch (err) {
      console.error("Polling error", err);
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      {/* <Typography variant="h5" sx={{ mb: 2 }}>
        Import KPI Actuals
      </Typography> */}

      <input type="file" accept=".csv" onChange={handleFileChange} />
      <Box mt={2} display="flex" gap={2}>
        <Button variant="contained" onClick={handleUpload} disabled={loading}>
          Upload
        </Button>
        {loading && <CircularProgress size={24} />}
      </Box>

      {jobId && (
        <Box mt={3}>
          <Typography>
            <strong>Job ID:</strong> {jobId}
          </Typography>
          <Typography>
            <strong>Status:</strong> {jobStatus}
          </Typography>
          {jobResult && (
            <Typography>
              <strong>Result:</strong> {jobResult}
            </Typography>
          )}
        </Box>
      )}

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
}
