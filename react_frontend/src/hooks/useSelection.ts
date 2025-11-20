import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "seating:selected";

function readInitialSelection(): string[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === "string");
    }

    if (parsed && typeof parsed === "object") {
      return Object.keys(parsed);
    }
  } catch {
    // ignore parse errors and fall back to empty selection
  }

  return [];
}

function persistSelection(ids: string[]) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage write errors (e.g., quota exceeded, private mode)
  }
}

export function useSelection(limit = 8) {
  const [selectedIds, setSelectedIds] = useState<string[]>(readInitialSelection);

  useEffect(() => {
    persistSelection(selectedIds);
  }, [selectedIds]);

  const toggle = useCallback((seatId: string) => {
    setSelectedIds((prev) => {
      const hasSeat = prev.includes(seatId);
      if (hasSeat) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= limit) {
        return prev;
      }
      return [...prev, seatId];
    });
  }, [limit]);

  const clear = useCallback(() => setSelectedIds([]), []);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return {
    selectedIds,
    selectedSet,
    toggle,
    clear,
    count: selectedIds.length,
    limit,
  };
}
