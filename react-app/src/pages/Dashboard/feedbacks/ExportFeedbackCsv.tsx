// src/components/Feedback/ExportFeedbackCsv.tsx
import React, { useState } from "react";
import axiosLaravel from "../../../axiosConfig/axiosLaravel";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  CircularProgress,
  Paper,
  Typography,
  Divider,
} from "@mui/material";

interface Props {
  onShowSnackbar: (msg: string, severity: "success" | "error") => void;
}

const ExportFeedbackCsv: React.FC<Props> = ({ onShowSnackbar }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  /* ---------------- PREVIEW ---------------- */
  const handlePreview = async () => {
    if (!fromDate || !toDate) {
      onShowSnackbar("Please select a date range", "error");
      return;
    }

    setPreviewLoading(true);

    try {
      const params: any = {
        from: fromDate,
        to: toDate,
      };

      if (status) params.status = status;

      const res = await axiosLaravel.get("/api/v1/feedback", { params });
      setPreview(res.data.data || []);
    } catch (err) {
      console.error(err);
      onShowSnackbar("Failed to load preview data", "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ---------------- EXPORT ---------------- */
  const handleExport = async () => {
    if (!fromDate || !toDate) {
      onShowSnackbar("Please select a date range", "error");
      return;
    }

    setLoading(true);

    try {
      const filters: any = {};
      if (status) filters.status = status;

      const params = {
        range: `${fromDate},${toDate}`,
        filters: JSON.stringify(filters),
      };

      const response = await axiosLaravel.get(
        "/api/v1/exports/feedback.csv",
        { params, responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `feedback_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onShowSnackbar("Feedback CSV exported successfully", "success");
    } catch (err) {
      console.error(err);
      onShowSnackbar("Failed to export feedback CSV", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
  <Box data-testid="export-feedback-container">
    {/* FILTER BAR */}
    <Box
      sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}
      data-testid="export-feedback-filter-bar"
    >
      <TextField
        type="date"
        label="From"
        InputLabelProps={{ shrink: true }}
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        size="small"
        data-testid="export-feedback-from-date"
      />

      <TextField
        type="date"
        label="To"
        InputLabelProps={{ shrink: true }}
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        size="small"
        data-testid="export-feedback-to-date"
      />

      <FormControl size="small" sx={{ minWidth: 150 }} data-testid="export-feedback-status-control">
        <InputLabel data-testid="export-feedback-status-label">Status</InputLabel>
        <Select
          value={status}
          label="Status"
          onChange={(e) => setStatus(e.target.value)}
          data-testid="export-feedback-status-select"
        >
          <MenuItem value="" data-testid="export-feedback-status-all">All</MenuItem>
          <MenuItem value="open" data-testid="export-feedback-status-open">Open</MenuItem>
          <MenuItem value="in_progress" data-testid="export-feedback-status-in-progress">In Progress</MenuItem>
          <MenuItem value="closed" data-testid="export-feedback-status-closed">Closed</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        onClick={handlePreview}
        disabled={previewLoading}
        data-testid="export-feedback-preview-button"
      >
        {previewLoading ? <CircularProgress size={20} data-testid="export-feedback-preview-loading" /> : "Preview"}
      </Button>

      <Button
        variant="contained"
        onClick={handleExport}
        disabled={loading}
        data-testid="export-feedback-export-button"
      >
        {loading ? <CircularProgress size={20} data-testid="export-feedback-export-loading" /> : "Export CSV"}
      </Button>
    </Box>

    {/* PREVIEW TABLE */}
    <Paper sx={{ p: 2 }} data-testid="export-feedback-preview-panel">
      <Typography variant="h6" sx={{ mb: 1 }} data-testid="export-feedback-preview-title">
        Preview ({preview.length})
      </Typography>

      <Divider sx={{ mb: 2 }} data-testid="export-feedback-preview-divider" />

      {preview.length === 0 ? (
        <Typography variant="body2" color="text.secondary" data-testid="export-feedback-no-data">
          No data to preview
        </Typography>
      ) : (
        preview.map((fb, index) => (
          <Box
            key={fb.feedback_id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              py: 1,
              borderBottom: "1px solid #eee",
            }}
            data-testid={`export-feedback-preview-row-${index}`}
          >
            <Typography fontWeight={600} data-testid={`export-feedback-preview-title-${index}`}>
              {fb.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" data-testid={`export-feedback-preview-status-${index}`}>
              {fb.status} • {fb.priority}
            </Typography>
          </Box>
        ))
      )}
    </Paper>
  </Box>
);

};

export default ExportFeedbackCsv;
