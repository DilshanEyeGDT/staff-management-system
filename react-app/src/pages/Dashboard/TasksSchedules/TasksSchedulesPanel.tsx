import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import SchedulePage from "./Schedules";
import TasksPage from "./Tasks";
import ScheduleImportPage from "./ScheduleImport";

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
        label="Tasks"
        id="tab-tasks"
        data-testid="tab-tasks"
      />
      <Tab
        label="import"
        id="tab-import"
        data-testid="tab-import"
      />
    </Tabs>

    <Box id="task-c-content">
      {tab === 0 && (
        <Box id="tab-content-schedules">
          <SchedulePage />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-tasks">
          <TasksPage />
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-import">
          <ScheduleImportPage />
        </Box>
      )}
    </Box>
  </Box>
);

};

export default TaskSchedulePage;
