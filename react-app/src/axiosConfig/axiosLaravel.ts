// src/axiosLaravel.ts
import axios from "axios";

const axiosLaravel = axios.create({
  baseURL: "http://127.0.0.1:8000", // Laravel API base URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosLaravel;
