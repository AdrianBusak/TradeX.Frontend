import { EconomicEvent } from '../../core/models/economic-calendar.model';

export function startOfLocalWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function localDateKey(value: string): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

export function groupAndSortEvents(events: EconomicEvent[]): Record<string, EconomicEvent[]> {
  return events.reduce<Record<string, EconomicEvent[]>>((groups, event) => {
    const key = localDateKey(event.scheduledAt);
    (groups[key] ??= []).push(event);
    return groups;
  }, Object.create(null));
}

export function sortByLocalTime(events: EconomicEvent[]): EconomicEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}
