// src/axiosConfig.ts
import axios from "axios";
import { getToken, removeToken } from "../services/auth";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8080/api/v1";

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Optional: response interceptor to handle 401
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // token invalid/expired -> clear local storage and redirect to login
      removeToken();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
