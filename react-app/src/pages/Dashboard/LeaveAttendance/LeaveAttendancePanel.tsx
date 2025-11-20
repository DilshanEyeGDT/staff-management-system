import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import AttendanceLog from "./AttendanceLog";
import LeaveRequests from "./LeaveRequests";
import KPI from "./KpiSection";

const LeaveAttendancePage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const handleChange = (_e: React.SyntheticEvent, newValue: number) => setTab(newValue);

  return (
  <Box id="leave-attendance-page">
    <Typography variant="h5" sx={{ mb: 3 }} id="leave-attendance-title">
      Leave & Attendance
    </Typography>

    <Tabs
      value={tab}
      onChange={handleChange}
      sx={{ mb: 3 }}
      id="leave-attendance-tabs"
    >
      <Tab
        label="Leave Requests"
        id="tab-leave-requests"
        data-testid="tab-leave-requests"
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

    <Box id="leave-attendance-content">
      {tab === 0 && (
        <Box id="tab-content-leave-requests">
          <LeaveRequests />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-attendance-log">
          <AttendanceLog />
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-kpi">
          <KPI />
        </Box>
      )}
    </Box>
  </Box>
);

};

export default LeaveAttendancePage;
