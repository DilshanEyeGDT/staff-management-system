import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { Train } from "@mui/icons-material";
import TrainingCoursesTab from "./TrainingCoursesTab";
import AssignKPIsTab from "./AssignKPIsTab";
import KpiSnapshotsTab from "./KPISnapshotsTab";
import KpiActualsImport from "./ImportActualKPIsTab";

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
        label="Assign Target KPIs"
        id="tab-target-kpis"
        data-testid="tab-target-kpis"
      />
      <Tab
        label="KPI Snapshots"
        id="tab-kpi-snapshots"
        data-testid="tab-kpi-snapshots"
      />
      <Tab
        label="Import Actual KPIs"
        id="tab-import"
        data-testid="tab-import"
      />
    </Tabs>

    <Box id="peformance-training-content">
      {tab === 0 && (
        <Box id="tab-content-training">
          <TrainingCoursesTab />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-assign-targets">
          <AssignKPIsTab />
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-kpi-snapshots">
            <KpiSnapshotsTab />
        </Box>
      )}

      {tab === 3 && (
        <Box id="tab-content-import">
          <KpiActualsImport />
        </Box>
      )}
    </Box>
  </Box>
);

};

export default PerformanceTrainingPage;
