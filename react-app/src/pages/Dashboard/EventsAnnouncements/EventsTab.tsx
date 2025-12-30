// src/components/events/EventsTab.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";
import axiosGo from "../../../axiosConfig/axiosGo";
import dayjs from "dayjs";
import EventDetailsDialog from "./EventDetailsDialog";
import CreateEventDialog from "./CreateEventDialog";

interface Event {
  id: number;
  title: string;
  summary: string;
  created_by_name: string;
  status: string;
  scheduled_at: string;
  created_at: string;
}

const EventsTab: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState("push");
  const [sinceDate, setSinceDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const [size] = useState(5);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  //floating buton
  const [openCreate, setOpenCreate] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = `/events?page=${page}&size=${size}`;
      if (channel) url += `&channel=${channel}`;
      if (sinceDate) url += `&since=${dayjs(sinceDate).toISOString()}`;

      const res = await axiosGo.get(url);
      // Ensure we always have an array
    if (Array.isArray(res.data)) {
      setEvents(res.data);
    } else {
      setEvents([]); // fallback for null or invalid response
    }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [channel, sinceDate, page]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      data-testid="events-container"
    >
      {/* Filters */}
      <Box
        sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}
        data-testid="events-filters"
      >
        <FormControl sx={{ minWidth: 120 }} data-testid="events-channel-filter">
          <InputLabel id="channel-select-label">Channel</InputLabel>
          <Select
            labelId="channel-select-label"
            value={channel}
            label="Channel"
            onChange={(e) => setChannel(e.target.value)}
            data-testid="events-channel-select"
          >
            <MenuItem value="" data-testid="events-channel-all">
              All
            </MenuItem>
            <MenuItem value="push" data-testid="events-channel-push">
              Push
            </MenuItem>
            <MenuItem value="email" data-testid="events-channel-email">
              Email
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Since Date"
          type="date"
          value={sinceDate}
          onChange={(e) => setSinceDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          data-testid="events-since-date"
        />

        <Button
          variant="contained"
          onClick={fetchEvents}
          data-testid="events-fetch-button"
        >
          Fetch Events
        </Button>
      </Box>

      {/* Event List */}
      {loading ? (
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          data-testid="events-loading"
        >
          <CircularProgress size={20} data-testid="events-loading-spinner" />
          <Typography data-testid="events-loading-text">
            Loading events...
          </Typography>
        </Box>
      ) : events.length === 0 ? (
        <Typography data-testid="events-empty">
          No events found.
        </Typography>
      ) : (
        events.map((event, index) => (
          <Paper
            key={event.id}
            sx={{
              p: 2,
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "scale(1.01)",
              },
            }}
            onClick={() => {
              setSelectedEventId(event.id);
              setDialogOpen(true);
            }}
            data-testid={`event-card-${index}`}
          >
            <Typography
              variant="h6"
              data-testid={`event-title-${index}`}
            >
              {event.title}
            </Typography>
            <Typography
              variant="body2"
              data-testid={`event-summary-${index}`}
            >
              {event.summary}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              data-testid={`event-meta-${index}`}
            >
              By {event.created_by_name} | Status: {event.status} | Scheduled:{" "}
              {dayjs(event.scheduled_at).format("YYYY-MM-DD HH:mm")}
            </Typography>
          </Paper>
        ))
      )}

      {/* Floating Add Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenCreate(true)}
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          width: 60,
          height: 60,
          borderRadius: "50%",
          fontSize: 32,
          minWidth: 0,
        }}
        data-testid="events-add-button"
      >
        +
      </Button>

      {/* Create Dialog */}
      <CreateEventDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={fetchEvents}
      />

      <EventDetailsDialog
        open={dialogOpen}
        eventId={selectedEventId}
        onClose={() => setDialogOpen(false)}
        onUpdated={fetchEvents}
      />
    </Box>
  );

};

export default EventsTab;
