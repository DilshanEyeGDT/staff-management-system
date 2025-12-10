// src/axiosGo.ts
import axios from "axios";

const axiosGo = axios.create({
  baseURL: "http://localhost:8088/api/v1", // base URL for Go backend endpoints
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosGo;
