export type EconomicEventImpact = 'Unknown' | 'Low' | 'Medium' | 'High' | 'Holiday';

export interface EconomicEvent {
  id: string;
  title: string;
  currency: string;
  scheduledAt: string;
  impact: EconomicEventImpact;
  forecast: string | null;
  previous: string | null;
}

export interface EconomicEventsResponse {
  items: EconomicEvent[];
  lastSyncedAt: string | null;
}

export interface EconomicCalendarFilters {
  impact: EconomicEventImpact | null;
  currency: string | null;
}
