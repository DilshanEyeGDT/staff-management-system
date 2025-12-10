import React, { useEffect, useState } from "react";
import { Typography, Button, Box, List, ListItemButton, ListItemText, ListItem, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import axios from "../../axiosConfig/axiosConfig";
import { getToken, removeToken, setToken } from "../../services/auth";
import { toast } from "react-toastify";
import HealthCheck from "./Auth/HealthCheck";
import ProfileSection from "./Auth/ProfileSection";
import UsersSection from "./Auth/UsersSection";
import RoleAssignSection from "./Auth/RoleAssignSection";
import LeaveAttendance from "./LeaveAttendance/LeaveAttendancePanel";
import RoomBookingPage from "./RoomBooking/Room&ResourcePanel";
import TaskSchedulePage from "./TasksSchedules/TasksSchedulesPanel";
import PerformanceTrainingPage from "./PerformanceTraining/PerformaceTrainingPanel";
import EventsAnnouncementsPage from "./EventsAnnouncements/EventsAnnoucememtsPanel";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState("profile");
  const [users, setUsers] = useState<any[]>([]);
  const [roleChanges, setRoleChanges] = useState<{ [userId: number]: string }>({});
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogoutClick = () => setLogoutDialogOpen(true);
    const handleCancel = () => setLogoutDialogOpen(false);
    const handleConfirmLogout = () => {
      setLogoutDialogOpen(false);
      removeToken();
      window.location.href = "http://localhost:8080/logout";
  };

  // ✅ Step 1: Grab token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("id_token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, []);

  // ✅ Step 2: Fetch profile
  useEffect(() => {
    let hasRedirected = false;

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
      .catch((err) => setError(err?.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));

    return () => {
      hasRedirected = true;
    };
  }, []);

  // ✅ Step 3: Fetch users list when needed
  useEffect(() => {
    if (selectedPage === "users" || selectedPage === "roleAssign") {
      axios
        .get("/admin/users?page=0&size=10")
        .then((res) => setUsers(res.data.content || []))
        .catch(console.error);
    }
  }, [selectedPage]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!authorized) return null;

  // ✅ Page renderer
  const renderContent = () => {
    switch (selectedPage) {
      case "profile":
        return <ProfileSection profile={profile} setProfile={setProfile} />;
      case "users":
        return <UsersSection users={users} />;
      case "roleAssign":
        return <RoleAssignSection users={users} roleChanges={roleChanges} setRoleChanges={setRoleChanges} />;
      case "leaveAttendance":
        return <LeaveAttendance />;
      case "roomBooking":
        return <RoomBookingPage />;
      case "tasksSchedules":
        return <TaskSchedulePage />;
      case "performanceTraining":
        return <PerformanceTrainingPage />;
      case "eventsAnnouncements":
        return <EventsAnnouncementsPage />;
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
      {/* Sidebar */}
      <Box
        id="dashboard-side-panel"
        width="220px"
        bgcolor="#f5f5f5"
        p={2}
        sx={{ borderRight: "1px solid #ddd" }}
      >
        <Typography variant="h5" sx={{ mb: 3 }} id="dashboard-title">
          Admin Portal
        </Typography>

        <List>
          {/* Profile */}
          <ListItem disablePadding>
            <ListItemButton
              id="nav-profile"
              selected={selectedPage === "profile"}
              onClick={() => setSelectedPage("profile")}
            >
              <ListItemText primary="My Profile" />
            </ListItemButton>
          </ListItem>

          {/* Admin-only items */}
          {profile?.roles?.includes("Admin") && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  id="nav-users"
                  selected={selectedPage === "users"}
                  onClick={() => setSelectedPage("users")}
                >
                  <ListItemText primary="Users" />
                </ListItemButton>
              </ListItem>

              <ListItem disablePadding>
                <ListItemButton
                  id="nav-roleAssign"
                  selected={selectedPage === "roleAssign"}
                  onClick={() => setSelectedPage("roleAssign")}
                >
                  <ListItemText primary="User Roles" />
                </ListItemButton>
              </ListItem>

              {/* Leave & Attendance */}
              <ListItem disablePadding>
                <ListItemButton
                  id="nav-leaveAttendance"
                  selected={selectedPage === "leaveAttendance"}
                  onClick={() => setSelectedPage("leaveAttendance")}
                >
                  <ListItemText primary="Leave & Attendance" />
                </ListItemButton>
              </ListItem>

              {/* Room & Resources */}
              <ListItem disablePadding>
                <ListItemButton
                  id="nav-roomBooking"
                  selected={selectedPage === "roomBooking"}
                  onClick={() => setSelectedPage("roomBooking")}
                >
                  <ListItemText primary="Rooms & Resources" />
                </ListItemButton>
              </ListItem>

              {/* Tasks & Schedules */}
              <ListItem disablePadding>
                <ListItemButton
                  id="nav-tasksSchedules"
                  selected={selectedPage === "tasksSchedules"}
                  onClick={() => setSelectedPage("tasksSchedules")}
                >
                  <ListItemText primary="Task & Schedules" />
                </ListItemButton>
              </ListItem>

              {/* Performance & Training */}
              <ListItem disablePadding>
                <ListItemButton
                  id="nav-performanceTraining"
                  selected={selectedPage === "performanceTraining"}
                  onClick={() => setSelectedPage("performanceTraining")}
                >
                  <ListItemText primary="Performance & Training" />
                </ListItemButton>
              </ListItem>

              {/* Events & Announcments */}
              <ListItem disablePadding>
                <ListItemButton
                  id="nav-eventsAnnouncements"
                  selected={selectedPage === "eventsAnnouncements"}
                  onClick={() => setSelectedPage("eventsAnnouncements")}
                >
                  <ListItemText primary="Events & Announcements" />
                </ListItemButton>
              </ListItem>
            </>
          )}

          {/* Health */}
          <ListItem disablePadding>
            <ListItemButton
              id="nav-health"
              selected={selectedPage === "health"}
              onClick={() => setSelectedPage("health")}
            >
              <ListItemText primary="Systems Health" />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Logout */}
        <Box mt="auto">
          <Button
            id="logout-button"
            variant="outlined"
            color="error"
            onClick={handleLogoutClick}
            fullWidth
          >
            Logout
          </Button>
        </Box>

        <Dialog open={logoutDialogOpen} onClose={handleCancel}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
      </Box>

      {/* Main Content */}
      <Box id="dashboard-main-content" flexGrow={1} p={4}>
        {renderContent()}
      </Box>
    </Box>
  );

};

export default Dashboard;
