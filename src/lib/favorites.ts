"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ucci:favorites";
const CHANGE_EVENT = "ucci:favorites-change";
const EMPTY: readonly string[] = Object.freeze([]);

let cachedFavorites: readonly string[] | null = null;

function readFromStorage(): readonly string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed.filter((v): v is string => typeof v === "string");
    return ids.length === 0 ? EMPTY : Object.freeze(ids);
  } catch {
    return EMPTY;
  }
}

function writeToStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  if (ids.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
  cachedFavorites = Object.freeze(ids.slice());
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const handler = () => {
    cachedFavorites = readFromStorage();
    onChange();
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

function getSnapshot(): readonly string[] {
  if (cachedFavorites === null) {
    cachedFavorites = readFromStorage();
  }
  return cachedFavorites;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const toggleFavorite = useCallback((id: string) => {
    const current = cachedFavorites ? [...cachedFavorites] : [...readFromStorage()];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [id, ...current];
    writeToStorage(next);
  }, []);

  const clearFavorites = useCallback(() => {
    writeToStorage([]);
  }, []);

  return { favorites, isFavorite, toggleFavorite, clearFavorites };
}
