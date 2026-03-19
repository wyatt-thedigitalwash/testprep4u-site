// Demo auth helpers for Phase 2 prototype.
// Uses localStorage — no real auth provider.
// Designed for easy swap to Supabase auth later.

import { demoStudent, type DemoStudent } from "./mock-data";

const AUTH_KEY = "tp4u_demo_auth";
const DEMO_EMAIL = "demo@testprep4u.com";
const DEMO_PASSWORD = "demo123";

export function login(email: string, password: string): boolean {
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, "true");
    }
    return true;
  }
  return false;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function getDemoUser(): DemoStudent | null {
  if (!isAuthenticated()) return null;
  return demoStudent;
}
