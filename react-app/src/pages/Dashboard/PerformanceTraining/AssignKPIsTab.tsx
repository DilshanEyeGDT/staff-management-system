import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Link,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";

interface KPI {
  kpiId: number;
  name: string;
  description: string;
  frequency: string;
}

interface User {
  id: number;
  displayName: string;
}

export default function AssignKPIsTab() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [targetValue, setTargetValue] = useState<number | "">("");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch KPIs
  const loadKpis = async () => {
    try {
      const response = await axiosNet.get("/v1/perf/kpis");
      setKpis(response.data);
    } catch (error) {
      console.error("Failed to load KPIs:", error);
    }
  };

  // Fetch Users
  const loadUsers = async () => {
    try {
      const response = await axiosNet.get("/v1/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  useEffect(() => {
    loadKpis();
    loadUsers();
  }, []);

  const handleAssignTarget = async () => {
    if (!selectedKpi || !selectedUserId || !periodStart || !periodEnd || targetValue === "") {
      setSnackbar({ open: true, message: "Please fill all fields", severity: "error" });
      return;
    }

    try {
      await axiosNet.post("/v1/perf/targets", {
        userId: selectedUserId,
        kpiId: selectedKpi.kpiId,
        periodStart,
        periodEnd,
        targetValue,
      });

      setSnackbar({
        open: true,
        message: `"${selectedKpi.name}" assigned to "${users.find(u => u.id === selectedUserId)?.displayName}"`,
        severity: "success",
      });

      // Reset form and close modal
      setSelectedKpi(null);
      setSelectedUserId("");
      setPeriodStart("");
      setPeriodEnd("");
      setTargetValue("");
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to assign target",
        severity: "error",
      });
    }
  };

  return (
    <Box id="tab-content-performance" p={3}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Available KPIs
      </Typography>

      {/* KPI List */}
      <Box display="flex" flexDirection="column" gap={2}>
        {kpis.map((kpi) => (
          <Box
            key={kpi.kpiId}
            onClick={() => setSelectedKpi(kpi)}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid #ddd",
              cursor: "pointer",
              transition: "0.2s",
              "&:hover": {
                backgroundColor: "#f7f7f7",
                transform: "scale(1.01)",
              },
            }}
          >
            <Typography variant="h6">{kpi.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {kpi.description}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Frequency:</strong> {kpi.frequency}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Assign KPI Modal */}
      <Dialog open={!!selectedKpi} onClose={() => setSelectedKpi(null)} maxWidth="md" fullWidth>
        <DialogTitle>Assign KPI Target</DialogTitle>
        <DialogContent>
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            gap={4}
            mt={1}
          >
            {/* Left: KPI Details */}
            <Box flex={1}>
              <Typography variant="h6">{selectedKpi?.name}</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {selectedKpi?.description}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Frequency:</strong> {selectedKpi?.frequency}
              </Typography>
            </Box>

            {/* Right: Assign Form */}
            <Box flex={1} display="flex" flexDirection="column" gap={2}>
              <FormControl fullWidth>
                <InputLabel id="user-select-label">Select User</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={selectedUserId}
                  label="Select User"
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Period Start"
                type="date"
                fullWidth
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Period End"
                type="date"
                fullWidth
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Target Value"
                type="number"
                fullWidth
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
              />

              <Box display="flex" gap={2} mt={1}>
                <Button variant="contained" onClick={handleAssignTarget}>
                  Assign Target
                </Button>
                <Button variant="outlined" onClick={() => setSelectedKpi(null)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
