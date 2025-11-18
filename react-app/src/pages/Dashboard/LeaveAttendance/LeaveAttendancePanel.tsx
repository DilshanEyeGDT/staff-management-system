import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import AttendanceLog from "./AttendanceLog";
import LeaveRequests from "./LeaveRequests";
import KPI from "./KpiSection";

const LeaveAttendancePage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const handleChange = (_e: React.SyntheticEvent, newValue: number) => setTab(newValue);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Leave & Attendance
      </Typography>

      <Tabs value={tab} onChange={handleChange} sx={{ mb: 3 }}>
        <Tab label="Leave Requests" />
        <Tab label="Attendance Log" />
        <Tab label="KPI" />
      </Tabs>

      <Box>
        {tab === 0 && (
          <Box>
            <LeaveRequests />
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <AttendanceLog />
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <KPI />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LeaveAttendancePage;
