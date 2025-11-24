import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import axios from "../../../axiosConfig";
import axiosLambda from "../../../axiosLambda";

const HealthCheck: React.FC = () => {
  const [authHealth, setAuthHealth] = useState<"ok" | "not_ok" | "loading">("loading");
  const [lambdaHealth, setLambdaHealth] = useState<"ok" | "not_ok" | "loading">("loading");

  const [authError, setAuthError] = useState<string | null>(null);
  const [lambdaError, setLambdaError] = useState<string | null>(null);

  const [lambdaData, setLambdaData] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      // ---------- Check Spring Boot Auth System ----------
      try {
        const response = await axios.get("http://localhost:8080/healthz");
        if (response.status === 200) {
          setAuthHealth("ok");
        } else {
          setAuthHealth("not_ok");
        }
      } catch (err: any) {
        setAuthHealth("not_ok");
        setAuthError(err?.response?.data?.message || "Auth server not reachable");
      }

      // ---------- Check AWS Lambda ----------
      try {
        const res = await axiosLambda.get("/healthz");
        setLambdaHealth("ok");
        setLambdaData(res.data);
      } catch (err: any) {
        setLambdaHealth("not_ok");
        setLambdaError(err?.response?.data?.message || "Lambda not reachable");
      }
    };

    checkHealth();
  }, []);

  return (
    <Box sx={{ mt: 6 }} id="healthcheck-container">
      <Typography variant="h5" gutterBottom id="healthcheck-title">
        Systems Health
      </Typography>

      {/* ---------- AUTH SYSTEM HEALTH ---------- */}
      <Typography variant="h6" sx={{ mt: 2 }}>
        🔐 Authentication System
      </Typography>

      {authHealth === "loading" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Checking Spring Boot Auth...</Typography>
        </Box>
      )}

      {authHealth === "ok" && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Spring Boot Auth System is Healthy
        </Alert>
      )}

      {authHealth === "not_ok" && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Auth System Unavailable  
          {authError && <Typography variant="body2">{authError}</Typography>}
        </Alert>
      )}

      {/* ---------- AWS LAMBDA HEALTH ---------- */}
      <Typography variant="h6" sx={{ mt: 4 }}>
        ☁️ AWS Lambda System
      </Typography>

      {lambdaHealth === "loading" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Checking AWS Lambda...</Typography>
        </Box>
      )}

      {lambdaHealth === "ok" && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Lambda is Healthy - RDS Connected
          {/* <pre style={{ marginTop: "8px", fontSize: "0.9rem" }}>
{JSON.stringify(lambdaData, null, 2)}
          </pre> */}
        </Alert>
      )}

      {lambdaHealth === "not_ok" && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Lambda Unavailable  
          {lambdaError && <Typography variant="body2">{lambdaError}</Typography>}
        </Alert>
      )}
    </Box>
  );
};

export default HealthCheck;
