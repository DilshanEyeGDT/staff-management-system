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
import axiosLambda from "../../../axiosConfig/axiosLambda";
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
  <Box
    id="room-utilization-page"
    data-testid="room-utilization-page"
    sx={{ p: 2 }}
  >
    <Typography
      id="room-utilization-title"
      data-testid="room-utilization-title"
      variant="h5"
      sx={{ mb: 3 }}
    >
      Room Utilization Report
    </Typography>

    {/* Filters */}
    <Box
      id="room-utilization-filters"
      data-testid="room-utilization-filters"
      sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}
    >
      <TextField
        id="utilization-filter-start-date"
        data-testid="utilization-filter-start-date"
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        id="utilization-filter-end-date"
        data-testid="utilization-filter-end-date"
        label="End Date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        id="utilization-filter-groupby"
        data-testid="utilization-filter-groupby"
        select
        label="Group By"
        value={groupBy}
        onChange={(e) => setGroupBy(e.target.value as "time" | "room")}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              id: "utilization-groupby-menu",
              "data-testid": "utilization-groupby-menu",
            },
          },
        }}
      >
        <MenuItem
          value="time"
          id="utilization-groupby-time"
          data-testid="utilization-groupby-time"
        >
          Time
        </MenuItem>

        <MenuItem
          value="room"
          id="utilization-groupby-room"
          data-testid="utilization-groupby-room"
        >
          Room
        </MenuItem>
      </TextField>

      <Button
        id="utilization-fetch-btn"
        data-testid="utilization-fetch-btn"
        variant="contained"
        onClick={fetchReport}
      >
        Fetch Report
      </Button>

      <Button
        id="utilization-download-btn"
        data-testid="utilization-download-btn"
        variant="contained"
        color="secondary"
        onClick={downloadPDF}
      >
        Download PDF
      </Button>
    </Box>

    {/* Loading */}
    {loading && (
      <Box
        id="room-utilization-loading"
        data-testid="room-utilization-loading"
        sx={{ textAlign: "center", mt: 3 }}
      >
        <CircularProgress
          id="room-utilization-loading-spinner"
          data-testid="room-utilization-loading-spinner"
        />
      </Box>
    )}

    {/* Error */}
    {error && (
      <Alert
        id="room-utilization-error"
        data-testid="room-utilization-error"
        severity="error"
        sx={{ mb: 2 }}
      >
        {error}
      </Alert>
    )}

    {/* Table */}
    {!loading && !error && data.length > 0 && (
      <Table
        id="room-utilization-table"
        data-testid="room-utilization-table"
      >
        <TableHead
          id="room-utilization-table-head"
          data-testid="room-utilization-table-head"
        >
          <TableRow
            id="room-utilization-table-head-row"
            data-testid="room-utilization-table-head-row"
          >
            <TableCell data-testid="utilization-col-date-room">
              Date / Room
            </TableCell>
            <TableCell data-testid="utilization-col-total-bookings">
              Total Bookings
            </TableCell>
            <TableCell data-testid="utilization-col-total-duration">
              Total Duration (hrs)
            </TableCell>
            <TableCell data-testid="utilization-col-utilization">
              Utilization (%)
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody
          id="room-utilization-table-body"
          data-testid="room-utilization-table-body"
        >
          {data.map((item, idx) => (
            <TableRow
              key={idx}
              id={`utilization-row-${idx}`}
              data-testid={`utilization-row-${idx}`}
            >
              <TableCell
                id={`utilization-date-${idx}`}
                data-testid={`utilization-date-${idx}`}
              >
                {dayjs(item.day).format("YYYY-MM-DD")}
              </TableCell>

              <TableCell
                id={`utilization-bookings-${idx}`}
                data-testid={`utilization-bookings-${idx}`}
              >
                {item.total_bookings}
              </TableCell>

              <TableCell
                id={`utilization-duration-${idx}`}
                data-testid={`utilization-duration-${idx}`}
              >
                {parseFloat(item.total_duration_hours).toFixed(2)}
              </TableCell>

              <TableCell
                id={`utilization-percentage-${idx}`}
                data-testid={`utilization-percentage-${idx}`}
              >
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
      data-testid="room-utilization-snackbar"
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
