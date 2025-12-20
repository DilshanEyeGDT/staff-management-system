import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  Switch,
} from "@mui/material";

interface RoomCardProps {
  room_id: number;
  room_name: string;
  description: string;
  capacity: number;
  location: string;
  equipments: string[];
  is_active: boolean;
  created_at: string;
  onClick: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room_id,
  room_name,
  description,
  capacity,
  location,
  equipments,
  is_active,
  created_at,
  onClick,
}) => {
  return (
  <Card
    onClick={onClick}
    sx={{
      mb: 2,
      p: 2,
      borderRadius: 3,
      minHeight: 260,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      borderLeft: "6px solid #1976d2",
      transition: "0.2s",
      "&:hover": { transform: "scale(1.02)" },
    }}
    id={`room-card-${room_id}`}
    data-testid={`room-card-${room_id}`}
  >
    <CardContent
      id={`room-card-content-${room_id}`}
      data-testid={`room-card-content-${room_id}`}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
        }}
        id={`room-card-header-${room_id}`}
        data-testid={`room-card-header-${room_id}`}
      >
        <Typography
          variant="h6"
          id={`room-name-${room_id}`}
          data-testid={`room-name-${room_id}`}
        >
          {room_name}
        </Typography>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          id={`room-status-${room_id}`}
          data-testid={`room-status-${room_id}`}
        >
          <Typography
            variant="caption"
            id={`room-status-text-${room_id}`}
            data-testid={`room-status-text-${room_id}`}
          >
            {is_active ? "Active" : "Inactive"}
          </Typography>

          <Switch
            checked={is_active}
            disabled
            size="small"
            id={`room-status-switch-${room_id}`}
            data-testid={`room-status-switch-${room_id}`}
          />
        </Stack>
      </Box>

      <Typography
        variant="body2"
        sx={{ mt: 1, mb: 1 }}
        id={`room-description-${room_id}`}
        data-testid={`room-description-${room_id}`}
      >
        {description}
      </Typography>

      <Typography
        variant="body2"
        id={`room-capacity-${room_id}`}
        data-testid={`room-capacity-${room_id}`}
      >
        <strong>Capacity:</strong> {capacity}
      </Typography>

      <Typography
        variant="body2"
        id={`room-location-${room_id}`}
        data-testid={`room-location-${room_id}`}
      >
        <strong>Location:</strong>{" "}
        {location === "G" ? "Floor G" : `Floor ${location}`}
      </Typography>

      {/* Equipments */}
      <Typography
        variant="body2"
        sx={{ mt: 1 }}
        id={`room-equipments-label-${room_id}`}
        data-testid={`room-equipments-label-${room_id}`}
      >
        <strong>Equipments:</strong>
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        sx={{ flexWrap: "wrap", mt: 0.5 }}
        id={`room-equipments-${room_id}`}
        data-testid={`room-equipments-${room_id}`}
      >
        {equipments.map((eq, idx) => (
          <Chip
            key={idx}
            label={eq}
            color="primary"
            size="small"
            id={`room-equipment-${room_id}-${idx}`}
            data-testid={`room-equipment-${room_id}-${idx}`}
          />
        ))}
      </Stack>

      <Typography
        variant="caption"
        sx={{ mt: 2, display: "block" }}
        id={`room-created-at-${room_id}`}
        data-testid={`room-created-at-${room_id}`}
      >
        Created at: {new Date(created_at).toLocaleString()}
      </Typography>
    </CardContent>
  </Card>
);

};

export default RoomCard;
