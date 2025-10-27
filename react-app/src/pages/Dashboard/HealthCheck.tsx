import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import axios from "../../axiosConfig"

const HealthCheck: React.FC = () => {
  const [status, setStatus] = useState<"ok" | "not_ok" | "loading">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get("http://localhost:8080/healthz");
        if (response.status === 200) {
          setStatus("ok");
        } else {
          setStatus("not_ok");
        }
      } catch (err: any) {
        setStatus("not_ok");
        setError(err?.response?.data?.message || "Server not reachable");
      }
    };
    checkHealth();
  }, []);

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        System Health
      </Typography>

      {status === "loading" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Checking server status...</Typography>
        </Box>
      )}

      {status === "ok" && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Server is Healthy (Status: 200 OK)
        </Alert>
      )}

      {status === "not_ok" && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Server is not reachable or returned an error.
          {error && <Typography variant="body2">{error}</Typography>}
        </Alert>
      )}
    </Box>
  );
};

export default HealthCheck;
