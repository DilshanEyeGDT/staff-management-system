// src/axiosNet.ts
import axios from "axios";

const axiosNet = axios.create({
  baseURL: "http://localhost:5083/api", // base URL for .NET endpoints
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosNet;
