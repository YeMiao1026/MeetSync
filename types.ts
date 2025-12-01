export interface User {
  id: string;
  name: string;
}

// Format: "YYYY-MM-DD:HH"
export type TimeSlot = string;

export interface Schedule {
  userId: string;
  selectedSlots: TimeSlot[];
}

export interface Room {
  id: string;
  name: string;
  startDate: string; // ISO Date string
  endDate: string;   // ISO Date string
  createdBy: string; // userId
  users: User[];
  schedules: Record<string, TimeSlot[]>; // userId -> slots
}

export type ViewState = 'LANDING' | 'DASHBOARD' | 'CREATE' | 'JOIN' | 'ROOM';