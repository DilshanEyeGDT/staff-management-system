import React, { useState } from "react";
import { Box, Typography, Button, TextField, Snackbar, Alert } from "@mui/material";
import axios from "../../../axiosConfig/axiosConfig";
import axiosLambda from "../../../axiosConfig/axiosLambda"; // <-- your Lambda axios client

interface Props {
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
}

const ProfileSection: React.FC<Props> = ({ profile, setProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.displayName || "");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const openSnackbar = (msg: string, type = "success") => {
    setSnackbar({ open: true, message: msg, type });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleUpdateDisplayName = async () => {
    try {
      await axios.patch("/me", { displayName: editName });
      openSnackbar("Display name updated successfully!");
      setProfile((prev: any) => ({ ...prev, displayName: editName }));
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      openSnackbar(err?.response?.data?.message || "Failed to update display name.", "error");
    }
  };

  // ✅ Clock In handler
  const handleClockIn = async () => {
    try {
      await axiosLambda.post("/api/v1/attendance/clock-in");
      openSnackbar("You clocked in!");
    } catch (err) {
      console.error(err);
      openSnackbar("Clock-in failed!", "error");
    }
  };

  // ✅ Clock Out handler
  const handleClockOut = async () => {
    try {
      await axiosLambda.post("/api/v1/attendance/clock-out");
      openSnackbar("You clocked out!");
    } catch (err) {
      console.error(err);
      openSnackbar("Clock-out failed!", "error");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {profile ? (
        <>
          <Typography variant="h5">My Profile</Typography>

          {!isEditing ? (
            <>
              <Typography sx={{ mt: 2 }}>
                Welcome, {profile.displayName || profile.email}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Role: {profile.roles?.[0] || "—"}
              </Typography>

              {/* Edit Display Name */}
              <Button
                id="edit-displayName-button"
                variant="outlined"
                sx={{ mt: 2, mr: 2 }}
                onClick={() => setIsEditing(true)}
              >
                Edit Display Name
              </Button>

              {/* CLOCK IN */}
              <Button
                variant="contained"
                color="success"
                sx={{ mt: 2, mr: 2 }}
                onClick={handleClockIn}
              >
                Clock In
              </Button>

              {/* CLOCK OUT */}
              <Button
                variant="contained"
                color="error"
                sx={{ mt: 2 }}
                onClick={handleClockOut}
              >
                Clock Out
              </Button>
            </>
          ) : (
            <>
              <TextField
                id="edit-displayName"
                label="Display Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                size="small"
                sx={{ mt: 2 }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  id="save-displayName"
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateDisplayName}
                  sx={{ mr: 2 }}
                >
                  Save
                </Button>
                <Button
                  id="cancel-displayName"
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </Box>
            </>
          )}

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.type as any}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </>
      ) : (
        <Typography>Loading profile...</Typography>
      )}
    </Box>
  );
};

export default ProfileSection;
