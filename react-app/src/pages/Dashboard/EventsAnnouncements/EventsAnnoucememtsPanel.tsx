import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import EventsTab from "./EventsTab";
import DraftEventsList from "./ConfirmEvents";
import ApprovedEvents from "./BroadcastEvents";

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
        label="Create & Upadate Events"
        id="tab-events"
        data-testid="tab-events"
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

    <Box id="events-content">
      {tab === 0 && (
        <Box id="tab-content-events">
          <EventsTab />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-confirm-events">
          <DraftEventsList />
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-broadcast-events">
          <ApprovedEvents />
        </Box>
      )}
    </Box>
  </Box>
);

};

export default EventsAnnouncementsPage;
