export interface CalendarDayData {
  date: string;
  debits: string;
  credits: string;
}

export interface DailyTotalsResponse {
  days: CalendarDayData[];
}

export interface CalendarCellData {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  debits: number;
  credits: number;
}
