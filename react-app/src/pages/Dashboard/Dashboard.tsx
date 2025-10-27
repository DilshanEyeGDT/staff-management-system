import React, { useEffect, useState } from "react";
import {
  Container,
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
} from "@mui/material";
import axios from "../../axiosConfig";
import { getToken, removeToken, setToken } from "../../services/auth";
import { Route, Routes, useNavigate } from "react-router-dom";
import HealthCheck from "./HealthCheck";
import UsersList from "./UsersList";
import UserProfile from "./UserProfile";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState("profile");
  const [users, setUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<string>("Checking...");
  const navigate = useNavigate();

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
    const token = getToken();
    if (!token) {
      setError("No token found. Please log in again.");
      return;
    }

    axios
      .get("/me")
      .then((res) => setProfile(res.data))
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || "Failed to load profile");
      });
  }, []);

  // ✅ Step 3: Fetch users list when selected
  useEffect(() => {
    if (selectedPage === "users") {
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
        .get("http://localhost:8080/healthz")
        .then((res) => setHealth(res.data))
        .catch(() => setHealth("Error"));
    }
  }, [selectedPage]);

  // ✅ Content Renderer
  const renderContent = () => {
    switch (selectedPage) {
      case "profile":
        return (
          <Box sx={{ mt: 4 }}>
            {profile ? (
              <>
                <Typography variant="h6">
                  Welcome, {profile.displayName || profile.email}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Role: {profile.roles?.[0] || "—"}
                </Typography>
              </>
            ) : (
              <Typography>Loading profile...</Typography>
            )}
          </Box>
        );

      case "users":
        return (
          <Box sx={{ mt: 4 }}>
            <UsersList />
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
          <ListItemButton
            selected={selectedPage === "users" || window.location.pathname.includes("/dashboard/users")}
            onClick={() => setSelectedPage("users")}
          >
            <ListItemText primary="Users" />
          </ListItemButton>
          <ListItemButton
            selected={selectedPage === "health"}
            onClick={() => setSelectedPage("health")}
          >
            <ListItemText primary="Health" />
          </ListItemButton>
        </List>

        <Box mt="auto">
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            fullWidth
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} p={4}>
        {error && <Typography color="error">{error}</Typography>}
        <Routes>
        <Route path="/" element={renderContent()} /> {/* default /dashboard */}
        <Route path="users" element={<UsersList />} /> {/* /dashboard/users */}
        <Route path="users/:userId" element={<UserProfile />} /> {/* /dashboard/users/1 */}
      </Routes>
      </Box>
    </Box>
  );
};

export default Dashboard;
