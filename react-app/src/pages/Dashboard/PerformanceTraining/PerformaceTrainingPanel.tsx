import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { Train } from "@mui/icons-material";
import TrainingTab from "./TrainingTab";
import PerformanceTab from "./KPITab";

const PerformanceTrainingPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const handleChange = (_e: React.SyntheticEvent, newValue: number) => setTab(newValue);

  return (
  <Box id="performance-training-page">
    <Typography variant="h5" sx={{ mb: 3 }} id="performance-training-title">
      Performace & Training
    </Typography>

    <Tabs
      value={tab}
      onChange={handleChange}
      sx={{ mb: 3 }}
      id="performance-training-tabs"
    >
      <Tab
        label="Training Courses"
        id="tab-training"
        data-testid="tab-training"
      />
      <Tab
        label="Assign Targets"
        id="tab-performance"
        data-testid="tab-performance"
      />
      <Tab
        label="Import"
        id="tab-import"
        data-testid="tab-import"
      />
    </Tabs>

    <Box id="peformance-training-content">
      {tab === 0 && (
        <Box id="tab-content-training">
          <TrainingTab />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-performance">
          <PerformanceTab />
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-import">
          <div>Import</div>
        </Box>
      )}
    </Box>
  </Box>
);

};

export default PerformanceTrainingPage;
