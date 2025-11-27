import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { Schedule } from "@mui/icons-material";
import SchedulePage from "./Schedules";

const TaskSchedulePage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const handleChange = (_e: React.SyntheticEvent, newValue: number) => setTab(newValue);

  return (
  <Box id="task-schedule-page">
    <Typography variant="h5" sx={{ mb: 3 }} id="task-schedule-title">
      Tasks & Schedules
    </Typography>

    <Tabs
      value={tab}
      onChange={handleChange}
      sx={{ mb: 3 }}
      id="task-schedule-tabs"
    >
      <Tab
        label="Schedules"
        id="tab-schedules"
        data-testid="tab-schedules"
      />
      <Tab
        label="Attendance Log"
        id="tab-attendance-log"
        data-testid="tab-attendance-log"
      />
      <Tab
        label="KPI"
        id="tab-kpi"
        data-testid="tab-kpi"
      />
    </Tabs>

    <Box id="task-schedule-content">
      {tab === 0 && (
        <Box id="tab-content-leave-requests">
          <SchedulePage />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-attendance-log">
          <div>task2</div>
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-kpi">
          <div>task3</div>
        </Box>
      )}
    </Box>
  </Box>
);

};

export default TaskSchedulePage;
