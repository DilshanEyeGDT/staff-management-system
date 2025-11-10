// src/components/PrivateRoute.tsx
import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../services/auth";

export const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
};
