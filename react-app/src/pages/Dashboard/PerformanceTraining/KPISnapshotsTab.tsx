import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import axiosNet from "../../../axiosConfig/axiosNet";

interface User {
  id: number;
  displayName: string;
}

interface KPI {
  kpiId: number;
  name: string;
  description: string;
  frequency: string;
}

interface Snapshot {
  kpiId: number;
  kpiName: string;
  targetValue: number;
  actualValue: number;
  difference: number;
  progress: number;
  periodStart: string;
  periodEnd: string;
}

export default function KpiSnapshotsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedKpiId, setSelectedKpiId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch users and KPIs
  const loadUsers = async () => {
    try {
      const response = await axiosNet.get("/v1/users");
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const loadKpis = async () => {
    try {
      const response = await axiosNet.get("/v1/perf/kpis");
      setKpis(response.data);
    } catch (err) {
      console.error("Failed to load KPIs:", err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadKpis();
  }, []);

  const fetchSnapshots = async () => {
    if (!selectedUserId || !selectedKpiId || !startDate || !endDate) return;
    setLoading(true);
    try {
      const response = await axiosNet.get(
        `/v1/perf/metrics`,
        {
          params: {
            user_id: selectedUserId,
            kpi: selectedKpiId,
            range: `${startDate}:${endDate}`,
          },
        }
      );
      setSnapshots(response.data);
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box id="tab-content-kpi-snapshots" p={3}>
      {/* <Typography variant="h5" sx={{ mb: 2 }}>
        KPI Snapshots
      </Typography> */}

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} mb={3}>
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

        <FormControl fullWidth>
          <InputLabel id="kpi-select-label">Select KPI</InputLabel>
          <Select
            labelId="kpi-select-label"
            value={selectedKpiId}
            label="Select KPI"
            onChange={(e) => setSelectedKpiId(Number(e.target.value))}
          >
            {kpis.map((kpi) => (
              <MenuItem key={kpi.kpiId} value={kpi.kpiId}>
                {kpi.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />

        <Button variant="contained" onClick={fetchSnapshots}>
          Fetch Snapshots
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={3}>
          <CircularProgress />
        </Box>
      ) : snapshots.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>KPI</TableCell>
              <TableCell>Target Value</TableCell>
              <TableCell>Actual Value</TableCell>
              <TableCell>Difference</TableCell>
              <TableCell>Progress (%)</TableCell>
              <TableCell>Period Start</TableCell>
              <TableCell>Period End</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {snapshots.map((s) => (
              <TableRow key={s.kpiId}>
                <TableCell>{s.kpiName}</TableCell>
                <TableCell>{s.targetValue}</TableCell>
                <TableCell>{s.actualValue}</TableCell>
                <TableCell>{s.difference}</TableCell>
                <TableCell>{s.progress.toFixed(2)}</TableCell>
                <TableCell>{s.periodStart.split("T")[0]}</TableCell>
                <TableCell>{s.periodEnd.split("T")[0]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography variant="body2" color="textSecondary" mt={2}>
          No snapshots found. Please select user, KPI and date range.
        </Typography>
      )}
    </Box>
  );
}
