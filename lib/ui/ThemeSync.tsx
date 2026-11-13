"use client";
import { useEffect } from "react";
import { watchThemePreference } from "./theme";
export function ThemeSync() {
  useEffect(watchThemePreference, []);
  return null;
}
