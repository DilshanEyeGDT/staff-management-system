import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import RoomList from "./RoomList";

const RoomBookingPage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const handleChange = (_e: React.SyntheticEvent, newValue: number) => setTab(newValue);

  return (
    <Box id="room-booking-page">
    <Typography variant="h5" sx={{ mb: 3 }} id="room-booking-title">
      Room & Resource Booking
    </Typography>

    <Tabs
      value={tab}
      onChange={handleChange}
      sx={{ mb: 3 }}
      id="room-booking-tabs"
    >
      <Tab
        label="Create Rooms"
        id="tab-room-booking"
        data-testid="tab-room-booking"
      />
      <Tab
        label="Room Reservations"
        id="tab-room-reservations"
        data-testid="tab-room-reservations"
      />
      <Tab
        label="Rooms KPI"
        id="tab-kpi"
        data-testid="tab-kpi"
      />
    </Tabs>

    <Box id="room-booking-content">
      {tab === 0 && (
        <Box id="tab-content-room-booking">
          <RoomList />
        </Box>
      )}

      {tab === 1 && (
        <Box id="tab-content-room-reservations">
          <div>Room Reservations Content Here</div>
        </Box>
      )}

      {tab === 2 && (
        <Box id="tab-content-kpi">
          <div>Rooms KPI Content Here</div>
        </Box>
      )}
    </Box>
  </Box>
);

};

export default RoomBookingPage;
