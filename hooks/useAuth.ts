"use client";
import { useSyncExternalStore } from "react";
import {
  getAuthSnapshot,
  subscribeToAuthChanges,
} from "@/service/auth";

export function useStoredAuth() {
  return useSyncExternalStore(subscribeToAuthChanges, getAuthSnapshot, () => null);
}
