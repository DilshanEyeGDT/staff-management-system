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
      minHeight: 260, // <-- makes card taller
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      borderLeft: "6px solid #1976d2",
      transition: "0.2s",
      "&:hover": { transform: "scale(1.02)" },
      }}
      id={`room-card-${room_id}`}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <Typography variant="h6">{room_name}</Typography>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption">
              {is_active ? "Active" : "Inactive"}
            </Typography>
            <Switch checked={is_active} disabled size="small" />
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
          {description}
        </Typography>

        <Typography variant="body2">
          <strong>Capacity:</strong> {capacity}
        </Typography>

        <Typography variant="body2">
          <strong>Location:</strong> {location === "G" ? "Floor G" : `Floor ${location}`}
        </Typography>

        {/* Equipments */}
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Equipments:</strong>
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", mt: 0.5 }}
        >
          {equipments.map((eq, idx) => (
            <Chip key={idx} label={eq} color="primary" size="small" />
          ))}
        </Stack>

        <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
          Created at: {new Date(created_at).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default RoomCard;
