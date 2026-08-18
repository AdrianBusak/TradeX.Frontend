import { Sort } from '@angular/material/sort';

export interface GridState {
  pageIndex: number;
  pageSize: number;
  sort: Sort | null;
  lastEditedId?: string | number;
}

export function getGridStorageKey(id: string): string {
  return `data-grid-${id}`;
}

export function loadGridState(id: string): GridState | null {
  const raw = localStorage.getItem(getGridStorageKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GridState;
  } catch {
    return null;
  }
}

export function patchGridState(id: string, patch: Partial<GridState>): void {
  const key = getGridStorageKey(id);
  const current = loadGridState(id) ?? { pageIndex: 0, pageSize: 20, sort: null };
  localStorage.setItem(key, JSON.stringify({ ...current, ...patch }));
}
