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
    <Box sx={{ mt: 6 }} id="healthcheck-container">
      <Typography variant="h5" gutterBottom id="healthcheck-title">
        System Health
      </Typography>

      {status === "loading" && (
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
          id="healthcheck-loading"
        >
          <CircularProgress size={20} id="healthcheck-spinner" />
          <Typography id="healthcheck-loading-text">
            Checking server status...
          </Typography>
        </Box>
      )}

      {status === "ok" && (
        <Alert severity="success" sx={{ mt: 2 }} id="healthcheck-success">
          Server is Healthy (Status: 200 OK)
        </Alert>
      )}

      {status === "not_ok" && (
        <Alert severity="error" sx={{ mt: 2 }} id="healthcheck-error">
          Server is not reachable or returned an error.
          {error && (
            <Typography variant="body2" id="healthcheck-error-text">
              {error}
            </Typography>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default HealthCheck;
