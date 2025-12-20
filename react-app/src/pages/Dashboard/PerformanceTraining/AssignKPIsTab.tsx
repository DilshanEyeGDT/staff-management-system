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
  <Box
    id="tab-content-performance"
    data-testid="tab-content-performance"
    p={3}
  >
    <Typography
      id="tab-assign-kpi-subtitle"
      data-testid="tab-assign-kpi-subtitle"
      variant="h6"
      sx={{ mb: 2 }}
    >
      Available KPIs
    </Typography>

    {/* KPI List */}
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      id="kpi-list-container"
      data-testid="kpi-list-container"
    >
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
          id={`kpi-card-${kpi.kpiId}`}
          data-testid={`kpi-card-${kpi.kpiId}`}
        >
          <Typography
            variant="h6"
            id={`kpi-name-${kpi.kpiId}`}
            data-testid={`kpi-name-${kpi.kpiId}`}
          >
            {kpi.name}
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            id={`kpi-description-${kpi.kpiId}`}
            data-testid={`kpi-description-${kpi.kpiId}`}
          >
            {kpi.description}
          </Typography>

          <Typography
            variant="body2"
            sx={{ mt: 0.5 }}
            id={`kpi-frequency-${kpi.kpiId}`}
            data-testid={`kpi-frequency-${kpi.kpiId}`}
          >
            <strong>Frequency:</strong> {kpi.frequency}
          </Typography>
        </Box>
      ))}
    </Box>

    {/* Assign KPI Modal */}
    <Dialog
      open={!!selectedKpi}
      onClose={() => setSelectedKpi(null)}
      maxWidth="md"
      fullWidth
      id="assign-kpi-dialog"
      data-testid="assign-kpi-dialog"
    >
      <DialogTitle
        id="assign-kpi-dialog-title"
        data-testid="assign-kpi-dialog-title"
      >
        Assign KPI Target
      </DialogTitle>

      <DialogContent
        id="assign-kpi-dialog-content"
        data-testid="assign-kpi-dialog-content"
      >
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          gap={4}
          mt={1}
        >
          {/* Left: KPI Details */}
          <Box
            flex={1}
            id="assign-kpi-details"
            data-testid="assign-kpi-details"
          >
            <Typography
              variant="h6"
              id="assign-kpi-name"
              data-testid="assign-kpi-name"
            >
              {selectedKpi?.name}
            </Typography>

            <Typography
              variant="body1"
              sx={{ mt: 1 }}
              id="assign-kpi-description"
              data-testid="assign-kpi-description"
            >
              {selectedKpi?.description}
            </Typography>

            <Typography
              variant="body2"
              sx={{ mt: 1 }}
              id="assign-kpi-frequency"
              data-testid="assign-kpi-frequency"
            >
              <strong>Frequency:</strong> {selectedKpi?.frequency}
            </Typography>
          </Box>

          {/* Right: Assign Form */}
          <Box
            flex={1}
            display="flex"
            flexDirection="column"
            gap={2}
            id="assign-kpi-form"
            data-testid="assign-kpi-form"
          >
            <FormControl fullWidth>
              <InputLabel id="assign-kpi-user-select-label">
                Select User
              </InputLabel>
              <Select
                labelId="assign-kpi-user-select-label"
                value={selectedUserId}
                label="Select User"
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                id="assign-kpi-user-select"
                data-testid="assign-kpi-user-select"
              >
                {users.map((user) => (
                  <MenuItem
                    key={user.id}
                    value={user.id}
                    id={`assign-kpi-user-option-${user.id}`}
                    data-testid={`assign-kpi-user-option-${user.id}`}
                  >
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
              id="assign-kpi-period-start"
              data-testid="assign-kpi-period-start"
            />

            <TextField
              label="Period End"
              type="date"
              fullWidth
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
              id="assign-kpi-period-end"
              data-testid="assign-kpi-period-end"
            />

            <TextField
              label="Target Value"
              type="number"
              fullWidth
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
              id="assign-kpi-target-value"
              data-testid="assign-kpi-target-value"
            />

            <Box
              display="flex"
              gap={2}
              mt={1}
              id="assign-kpi-action-buttons"
              data-testid="assign-kpi-action-buttons"
            >
              <Button
                variant="contained"
                onClick={handleAssignTarget}
                id="assign-kpi-submit-button"
                data-testid="assign-kpi-submit-button"
              >
                Assign Target
              </Button>

              <Button
                variant="outlined"
                onClick={() => setSelectedKpi(null)}
                id="assign-kpi-cancel-button"
                data-testid="assign-kpi-cancel-button"
              >
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
      id="kpi-snackbar"
      data-testid="kpi-snackbar"
    >
      <Alert
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        sx={{ width: "100%" }}
        id="kpi-snackbar-alert"
        data-testid="kpi-snackbar-alert"
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  </Box>
);

}
