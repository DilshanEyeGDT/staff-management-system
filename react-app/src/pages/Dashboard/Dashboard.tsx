import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  IconButton,
  TextField
} from "@mui/material";
import axios from "../../axiosConfig";
import { getToken, removeToken, setToken } from "../../services/auth";
import HealthCheck from "./HealthCheck";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState("profile");
  const [users, setUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<string>("Checking...");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [roleChanges, setRoleChanges] = useState<{ [userId: number]: string }>({});
  const [editName, setEditName] = useState<string>(""); // ✅ For editing display name
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // ✅ new
const [authorized, setAuthorized] = useState(false); // ✅ new

  // ✅ Logout handler
  const handleLogout = () => {
    const token = getToken();
    removeToken();
    window.location.href = `http://localhost:8080/logout?token=${token}`;
  };

  // ✅ Step 1: Grab token from URL after Cognito redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, []);

  // ✅ Step 2: Fetch profile using token
  useEffect(() => {
    let hasRedirected = false; // ✅ prevent multiple redirects

    const token = getToken();
    if (!token) {
      setError("No token found. Please log in again.");
      return;
    }

    axios
      .get("/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const user = res.data;
        setProfile(user);
        setEditName(user.displayName || "");

        if (!user.roles?.includes("Admin")) {
          if (!hasRedirected) {
            hasRedirected = true;
            toast.error("You are not authorized to access this system.", {
              onClose: () => {
                localStorage.removeItem("token");
                window.location.href = `http://localhost:8080/logout?token=${token}`;
              },
            });
          }
        } else {
          setAuthorized(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load profile");
      })
      .finally(() => setLoading(false));

    // ✅ clean up to prevent toast after unmount
    return () => {
      hasRedirected = true;
    };
  }, []);

  // ✅ Step 3: Fetch users list when selected
  useEffect(() => {
    if (selectedPage === "users" || selectedPage === "roleAssign") {
      axios
        .get("/admin/users?page=0&size=10")
        .then((res) => setUsers(res.data.content || []))
        .catch((err) => console.error(err));
    }
  }, [selectedPage]);

  // ✅ Step 4: Fetch health status when selected
  useEffect(() => {
    if (selectedPage === "health") {
      axios
        .get("/healthz")
        .then((res) => setHealth(res.data))
        .catch(() => setHealth("Error"));
    }
  }, [selectedPage]);

  // ✅ Handle role save
  const handleSaveRole = async (userId: number) => {
    const newRole = roleChanges[userId];
    if (!newRole) return;

    try {
      await axios.patch(`/admin/users/${userId}/roles`, { roles: [newRole] });
      alert("Role updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update role.");
    }
  };

  // ✅ Handle display name update
  const handleUpdateDisplayName = async () => {
    try {
      await axios.patch("/me", { displayName: editName });
      alert("Display name updated successfully!");
      setProfile((prev: any) => ({ ...prev, displayName: editName }));
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update display name.");
    }
  };

  // ✅ Content Renderer
  const renderContent = () => {
    switch (selectedPage) {
      case "profile":
        return (
          <Box sx={{ mt: 4 }}>
            {profile ? (
              <>
                <Typography variant="h6">Profile</Typography>

                {!isEditing ? (
                  <>
                    <Typography sx={{ mt: 2 }}>
                      Welcome, {profile.displayName || profile.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Role: {profile.roles?.[0] || "—"}
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Display Name
                    </Button>
                  </>
                ) : (
                  <>
                    <TextField
                      label="Display Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      size="small"
                      sx={{ mt: 2 }}
                    />
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpdateDisplayName}
                        sx={{ mr: 2 }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </>
                )}
              </>
            ) : (
              <Typography>Loading profile...</Typography>
            )}
          </Box>
        );

      case "users":
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              User List
            </Typography>
            {selectedUser ? (
              <Box>
                <Button variant="outlined" onClick={() => setSelectedUser(null)}>
                  ← Back to Users
                </Button>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">User Details</Typography>
                  <Typography>Email: {selectedUser.email}</Typography>
                  <Typography>Display Name: {selectedUser.displayName}</Typography>
                  <Typography>Roles: {selectedUser.roles?.join(", ")}</Typography>

                {/* ✅ Audit Logs Section */}
                {selectedUser.auditLogs && selectedUser.auditLogs.length > 0 ? (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6">Audit Logs</Typography>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Event Type</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>User Agent</TableCell>
                          <TableCell>Created At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedUser.auditLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>{log.eventType}</TableCell>
                            <TableCell>{log.eventDesc}</TableCell>
                            <TableCell>{log.ipAddress}</TableCell>
                            <TableCell>{log.userAgent}</TableCell>
                            <TableCell>
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Typography sx={{ mt: 2 }}>No audit logs available.</Typography>
                )}
                </Box>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Display Name</TableCell>
                    <TableCell>Roles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => {
                        axios
                          .get(`/admin/users/${user.id}`)
                          .then((res) => setSelectedUser(res.data))
                          .catch((err) => console.error(err));
                      }}
                    >
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.displayName}</TableCell>
                      <TableCell>{user.roles?.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        );

      case "roleAssign":
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Assign Roles
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                      <Select
                        value={roleChanges[user.id] || user.roles?.[0] || ""}
                        onChange={(e) =>
                          setRoleChanges((prev) => ({
                            ...prev,
                            [user.id]: e.target.value,
                          }))
                        }
                        size="small"
                      >
                        {[
                          "Admin",
                          "HR",
                          "Management_L1",
                          "Management_L2",
                          "Management_L3",
                          "Employee",
                        ].map((role) => (
                          <MenuItem key={role} value={role}>
                            {role}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleSaveRole(user.id)}>
                        <SaveIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        );

      case "health":
        return (
          <Box sx={{ mt: 4 }}>
            <HealthCheck />
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  // 🚫 If not authorized, don’t render anything (to prevent dashboard flash)
  if (!authorized) return null;

  return (
    <Box display="flex" height="100vh">
      {/* Side Panel */}
      <Box
        width="220px"
        bgcolor="#f5f5f5"
        p={2}
        sx={{ borderRight: "1px solid #ddd" }}
      >
        <Typography variant="h5" sx={{ mb: 3 }}>
          Admin Portal
        </Typography>
        <List>
          <ListItemButton
            selected={selectedPage === "profile"}
            onClick={() => setSelectedPage("profile")}
          >
            <ListItemText primary="Profile" />
          </ListItemButton>
          
          {profile?.roles?.includes("Admin") && (
            <>
              <ListItemButton
                selected={selectedPage === "users"}
                onClick={() => setSelectedPage("users")}
              >
                <ListItemText primary="Users" />
              </ListItemButton>

              <ListItemButton
                selected={selectedPage === "roleAssign"}
                onClick={() => setSelectedPage("roleAssign")}
              >
                <ListItemText primary="Role Assign" />
              </ListItemButton>
            </>
          )}

          <ListItemButton
            selected={selectedPage === "health"}
            onClick={() => setSelectedPage("health")}
          >
            <ListItemText primary="Health" />
          </ListItemButton>
        </List>

        <Box mt="auto">
          <Button variant="outlined" color="error" onClick={handleLogout} fullWidth>
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} p={4}>
        {error && <Typography color="error">{error}</Typography>}
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Dashboard;
