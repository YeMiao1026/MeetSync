export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getDatesInRange = (startDate: string, endDate: string): Date[] => {
  const dates: Date[] = [];
  const currDate = new Date(startDate);
  const lastDate = new Date(endDate);

  while (currDate <= lastDate) {
    dates.push(new Date(currDate));
    currDate.setDate(currDate.getDate() + 1);
  }
  return dates;
};

export const formatDisplayDate = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' }).format(date);
};

export const getSlotId = (date: Date, hour: number): string => {
  return `${formatDate(date)}:${hour.toString().padStart(2, '0')}`;
};

export const parseSlotId = (slotId: string): { dateStr: string; hour: number } => {
  const [dateStr, hourStr] = slotId.split(':');
  return { dateStr, hour: parseInt(hourStr, 10) };
};
