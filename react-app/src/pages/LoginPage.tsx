// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { Container, Box, TextField, Button, Typography } from "@mui/material";

const LoginPage: React.FC = () => {
  const [email] = useState("");
  const [password] = useState("");

  const handleLogin = async () => {
    // Redirect to backend OAuth start URL (Spring Boot endpoint that starts Cognito)
    const oauthStart = process.env.REACT_APP_OAUTH_START || "http://localhost:8080/oauth2/authorization/cognito";
    window.location.href = oauthStart;
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 12, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>Admin Login</Typography>

        {/* optional fields if you want a local credential UI, but using Cognito hosted UI is recommended */}
        <TextField fullWidth label="Email" margin="normal" value={email} disabled />
        <TextField fullWidth label="Password" type="password" margin="normal" value={password} disabled />

        <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleLogin}>
          Sign in with Cognito
        </Button>

        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          You will be redirected to Cognito for authentication.
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
