import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { Train } from "@mui/icons-material";

const EventsAnnouncementsPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const handleChange = (_e: React.SyntheticEvent, newValue: number) => setTab(newValue);

  return (
  <Box id="events-announcements-page">
    <Typography variant="h5" sx={{ mb: 3 }} id="events-announcements-title">
      Events & Announcements
    </Typography>

    <Tabs
      value={tab}
      onChange={handleChange}
      sx={{ mb: 3 }}
      id="events-announcements-tabs"
    >
      <Tab
        label="Events"
        id="tab-events"
        data-testid="tab-events"
      />
      <Tab
        label="Create Events"
        id="tab-create-events"
        data-testid="tab-create-events"
      />
    </Tabs>

    <Box id="events-content">
      {tab === 0 && (
        <Box id="tab-content-events">
          <div>Events tab</div>
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-create-events">
          <div>Create events tab</div>
        </Box>
      )}
    </Box>
  </Box>
);

};

export default EventsAnnouncementsPage;
