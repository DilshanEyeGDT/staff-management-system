import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { Feed, Train } from "@mui/icons-material";
import App from "../../../App";
import FeedbackListLaravel from "./FeedbackListLaravel";

const FeedbackReportPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const handleChange = (_e: React.SyntheticEvent, newValue: number) => setTab(newValue);

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
        label="Event Confirmations"
        id="tab-confirm-events"
        data-testid="tab-confirm-events"
      />
      <Tab
        label="Broadcast Events"
        id="tab-broadcast-events"
        data-testid="tab-broadcast-events"
      />
    </Tabs>

    <Box id="feedback-content">
      {tab === 0 && (
        <Box id="tab-content-feedback">
          <FeedbackListLaravel />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-confirm-feedback">
          <div>Event Creation Form Component Goes Here</div>
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-broadcast-feedback">
          <div>Event Creation Form Component Goes Here</div>
        </Box>
      )}
    </Box>
  </Box>
);

};

export default FeedbackReportPage;
