"use client";

import { useState, useCallback, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("shadow_session="))
      ?.split("=")[1];
    if (token) {
      setState((s) => ({ ...s, isAuthenticated: true, isLoading: false }));
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (key: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await fetch(`${API_URL}/api/auth/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) {
        setState({ isAuthenticated: true, isLoading: false, error: null });
        return true;
      }
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: data.error || "Invalid code",
      });
      return false;
    } catch {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: "Network error",
      });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    document.cookie =
      "shadow_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setState({ isAuthenticated: false, isLoading: false, error: null });
    window.location.href = "/";
  }, []);

  return { ...state, login, logout };
}
