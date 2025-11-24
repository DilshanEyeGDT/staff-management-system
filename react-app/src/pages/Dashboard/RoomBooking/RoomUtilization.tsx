// src/components/RoomBooking/RoomUtilization.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Button,
  MenuItem,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import axiosLambda from "../../../axiosLambda";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ default import


interface UtilizationItem {
  day: string;
  total_bookings: string;
  total_duration_hours: string;
  utilization_percentage: string;
}

const RoomUtilization: React.FC = () => {
  const [data, setData] = useState<UtilizationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [groupBy, setGroupBy] = useState<"time" | "room">("time");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error">("success");

  const showSnackbar = (msg: string, severity: "success" | "error") => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchReport = () => {
    setLoading(true);
    setError("");

    axiosLambda
      .get(
        `/api/v1/reports/utilization?start_date=${startDate}&end_date=${endDate}&group_by=${groupBy}`
      )
      .then((res) => {
        setData(res.data.data || []);
        if (!res.data.data || res.data.data.length === 0) {
          showSnackbar("No data available for this range", "error");
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to fetch report");
      })
      .finally(() => setLoading(false));
  };

  const downloadPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Room Utilization Report", 14, 22);

  const headers = [["Day", "Total Bookings", "Total Duration (hrs)", "Utilization (%)"]];

  const rows = data.map((item) => [
    new Date(item.day).toLocaleDateString(),
    item.total_bookings,
    Number(item.total_duration_hours).toFixed(2),
    Number(item.utilization_percentage).toFixed(2),
  ]);

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 30,
  });

  doc.save("room_utilization_report.pdf");
};


  useEffect(() => {
    fetchReport();
  }, []);

  return (
  <Box id="room-utilization-page" sx={{ p: 2 }}>
    <Typography id="room-utilization-title" variant="h5" sx={{ mb: 3 }}>
      Room Utilization Report
    </Typography>

    {/* Filters */}
    <Box id="room-utilization-filters" sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
      <TextField
        id="utilization-filter-start-date"
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        id="utilization-filter-end-date"
        label="End Date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        id="utilization-filter-groupby"
        select
        label="Group By"
        value={groupBy}
        onChange={(e) => setGroupBy(e.target.value as "time" | "room")}
      >
        <MenuItem value="time">Time</MenuItem>
        <MenuItem value="room">Room</MenuItem>
      </TextField>

      <Button id="utilization-fetch-btn" variant="contained" onClick={fetchReport}>
        Fetch Report
      </Button>
      <Button id="utilization-download-btn" variant="contained" color="secondary" onClick={downloadPDF}>
        Download PDF
      </Button>
    </Box>

    {/* Loading */}
    {loading && (
      <Box id="room-utilization-loading" sx={{ textAlign: "center", mt: 3 }}>
        <CircularProgress />
      </Box>
    )}

    {/* Error */}
    {error && (
      <Alert id="room-utilization-error" severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )}

    {/* Table */}
    {!loading && !error && data.length > 0 && (
      <Table id="room-utilization-table">
        <TableHead>
          <TableRow>
            <TableCell>Date / Room</TableCell>
            <TableCell>Total Bookings</TableCell>
            <TableCell>Total Duration (hrs)</TableCell>
            <TableCell>Utilization (%)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow key={idx} id={`utilization-row-${idx}`}>
              <TableCell id={`utilization-date-${idx}`}>
                {dayjs(item.day).format("YYYY-MM-DD")}
              </TableCell>
              <TableCell id={`utilization-bookings-${idx}`}>
                {item.total_bookings}
              </TableCell>
              <TableCell id={`utilization-duration-${idx}`}>
                {parseFloat(item.total_duration_hours).toFixed(2)}
              </TableCell>
              <TableCell id={`utilization-percentage-${idx}`}>
                {parseFloat(item.utilization_percentage).toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}

    {/* Snackbar */}
    <Snackbar
      id="room-utilization-snackbar"
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={() => setSnackbarOpen(false)}
      message={snackbarMsg}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    />
  </Box>
);

};

export default RoomUtilization;
