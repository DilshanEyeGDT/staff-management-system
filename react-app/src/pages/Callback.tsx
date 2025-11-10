// src/pages/Callback.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../services/auth";

const extractTokenFromSearch = (search: string): string | null => {
  const params = new URLSearchParams(search);
  return params.get("token") || params.get("access_token") || params.get("id_token");
};

const extractTokenFromHash = (hash: string): string | null => {
  if (!hash) return null;
  // hash looks like "#access_token=xxx&id_token=yyy"
  const cleaned = hash.startsWith("#") ? hash.substring(1) : hash;
  const params = new URLSearchParams(cleaned);
  return params.get("token") || params.get("access_token") || params.get("id_token");
};

const Callback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      extractTokenFromSearch(window.location.search) || extractTokenFromHash(window.location.hash);

    if (token) {
      setToken(token);
      // Remove token from URL (clean up)
      window.history.replaceState({}, document.title, "/dashboard");
      navigate("/dashboard", { replace: true });
    } else {
      // No token — you might be using server-set cookie. If so, try hitting /me to check session.
      // We'll attempt to fetch /me using axios; but to keep this file simple, redirect to dashboard
      // and let the dashboard handle failing calls (it will redirect to login if 401).
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return <div>Signing you in...</div>;
};

export default Callback;
