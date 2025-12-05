// src/axiosLambda.ts
import axios, { AxiosInstance } from "axios";
import { getToken, removeToken } from "../services/auth";

// Use Lambda base URL from env OR fallback
const lambdaBaseURL =
  process.env.REACT_APP_LAMBDA_API_URL ||
  "https://37w8g0zg3k.execute-api.ap-southeast-2.amazonaws.com/dev";

const axiosLambda: AxiosInstance = axios.create({
  baseURL: lambdaBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach ID Token to requests
axiosLambda.interceptors.request.use((config) => {
  const token = getToken(); // MUST return Cognito Id Token (not access token)

  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// Handle 401 from Lambda
axiosLambda.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      console.warn("Lambda: Invalid/Expired Token → Logging out");

      removeToken();
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default axiosLambda;
