import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import axios from "../../../axiosConfig";

interface Props {
  users: any[];
  roleChanges: { [userId: number]: string };
  setRoleChanges: React.Dispatch<React.SetStateAction<{ [userId: number]: string }>>;
}

const RoleAssignSection: React.FC<Props> = ({ users, roleChanges, setRoleChanges }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const handleSaveRole = async (userId: number) => {
    const newRole = roleChanges[userId];
    if (!newRole) return;
    try {
      await axios.patch(`/admin/users/${userId}/roles`, { roles: [newRole] });
      setSnackbarMsg("Role updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error(err);
      setSnackbarMsg(err?.response?.data?.message || "Failed to update role.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Assign Roles
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell scope="col">Email</TableCell>
            <TableCell scope="col">Display Name</TableCell>
            <TableCell scope="col">Role</TableCell>
            <TableCell scope="col">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.displayName}</TableCell>
              <TableCell>
                <Select
                  id={`role-select-${user.id}`}
                  aria-label={`Select role for ${user.displayName}`}
                  value={roleChanges[user.id] || user.roles?.[0] || ""}
                  onChange={(e) =>
                    setRoleChanges((prev) => ({
                      ...prev,
                      [user.id]: e.target.value,
                    }))
                  }
                  size="small"
                >
                  {["Admin", "HR", "Management_L1", "Management_L2", "Management_L3", "Employee"].map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <IconButton
                  id={`save-role-${user.id}`}
                  color="primary"
                  onClick={() => handleSaveRole(user.id)}
                  aria-label={`Save role for ${user.displayName}`}
                  title="Save Role" // optional tooltip for mouse users
                >
                  <SaveIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ✅ Snackbar for success/error messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleAssignSection;
