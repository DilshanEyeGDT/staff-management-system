import React, { useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import FeedbackListLaravel from "./FeedbackListLaravel";
import ExportFeedbackCsv from "./ExportFeedbackCsv";

const FeedbackReportPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  // 🔔 Snackbar state (GLOBAL for both tabs)
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error">("success");

  const handleChange = (_e: React.SyntheticEvent, newValue: number) =>
    setTab(newValue);

  const handleShowSnackbar = (
    msg: string,
    severity: "success" | "error"
  ) => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <Box id="feedback-report-page">
      <Typography variant="h5" sx={{ mb: 3 }} id="feedback-report-title">
        Feedback & Reports
      </Typography>

      <Tabs
        value={tab}
        onChange={handleChange}
        sx={{ mb: 3 }}
        id="feedback-report-tabs"
      >
        <Tab
          label="Feedbacks"
          id="tab-feedbacks"
          data-testid="tab-feedbacks"
        />
        <Tab
          label="Export Feedbacks"
          id="tab-export-feedbacks"
          data-testid="tab-export-feedbacks"
        />
      </Tabs>

      <Box id="feedback-content">
        {tab === 0 && (
          <Box id="tab-content-feedback">
            <FeedbackListLaravel />
          </Box>
        )}

        {tab === 1 && (
          <Box id="tab-content-export-feedbacks">
            <ExportFeedbackCsv onShowSnackbar={handleShowSnackbar} />
          </Box>
        )}
      </Box>

      {/* 🔔 GLOBAL SNACKBAR */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        data-testid="global-snackbar"
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          data-testid="global-snackbar-alert"
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FeedbackReportPage;
