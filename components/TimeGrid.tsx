import React, { useMemo } from 'react';
import { Room, User, TimeSlot } from '../types';
import { getDatesInRange, getSlotId, formatDisplayDate } from '../utils';
import Tooltip from './Tooltip';

interface TimeGridProps {
  room: Room;
  currentUser: User;
  onToggleSlot: (slotId: TimeSlot) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TimeGrid: React.FC<TimeGridProps> = ({ room, currentUser, onToggleSlot }) => {
  const dates = useMemo(() => getDatesInRange(room.startDate, room.endDate), [room.startDate, room.endDate]);

  // Pre-calculate slot statistics
  const slotStats = useMemo(() => {
    const stats: Record<string, { count: number; users: string[] }> = {};
    
    Object.entries(room.schedules).forEach(([userId, slots]) => {
      const user = room.users.find(u => u.id === userId);
      if (!user) return;

      (slots as TimeSlot[]).forEach(slot => {
        if (!stats[slot]) {
          stats[slot] = { count: 0, users: [] };
        }
        stats[slot].count += 1;
        stats[slot].users.push(user.name);
      });
    });
    return stats;
  }, [room.schedules, room.users]);

  // Check if current user selected a slot
  const isSelectedByMe = (slotId: string) => {
    return room.schedules[currentUser.id]?.includes(slotId) || false;
  };

  // Get background color based on availability density
  const getSlotColor = (slotId: string, isSelected: boolean) => {
    const stat = slotStats[slotId];
    const totalUsers = room.users.length;
    
    if (isSelected) {
      return "bg-slate-800 border-slate-900"; // Dark for self
    }

    if (!stat || stat.count === 0) {
      return "bg-white hover:bg-slate-50";
    }

    // Calculate intensity (skip current user for visual clarity of "others", or include? Let's include all)
    // Intensity logic: more people = darker green/indigo
    const ratio = stat.count / totalUsers;

    if (ratio <= 0.25) return "bg-indigo-100 hover:bg-indigo-200";
    if (ratio <= 0.5) return "bg-indigo-300 hover:bg-indigo-400";
    if (ratio <= 0.75) return "bg-indigo-400 hover:bg-indigo-500";
    return "bg-indigo-500 hover:bg-indigo-600";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
      {/* Header Row (Dates) */}
      <div className="flex border-b border-slate-200">
        <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-200 p-2 text-xs font-bold text-slate-400 uppercase text-center flex items-center justify-center sticky left-0 z-10">
          Time
        </div>
        <div className="flex overflow-x-auto divide-x divide-slate-200 scrollbar-hide">
          {dates.map((date) => (
            <div key={date.toISOString()} className="w-24 flex-shrink-0 p-3 text-center bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {formatDisplayDate(date).split(' ')[0]} {/* Month */}
              </div>
              <div className="text-sm font-bold text-slate-800">
                {formatDisplayDate(date).split(' ').slice(1).join(' ')} {/* Day */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Body */}
      <div className="overflow-y-auto overflow-x-auto flex-1 relative">
        {HOURS.map((hour) => (
          <div key={hour} className="flex divide-x divide-slate-100 border-b border-slate-100 min-w-max">
            {/* Hour Label */}
            <div className="w-16 flex-shrink-0 flex items-center justify-center text-xs text-slate-400 bg-slate-50 border-r border-slate-200 sticky left-0 z-10 select-none">
              {hour}:00
            </div>

            {/* Time Slots */}
            {dates.map((date) => {
              const slotId = getSlotId(date, hour);
              const isSelected = isSelectedByMe(slotId);
              const stat = slotStats[slotId];
              const count = stat?.count || 0;
              const hasOthers = count > 0 && (!isSelected || count > 1);

              return (
                <div key={slotId} className="w-24 flex-shrink-0 h-10 relative">
                  <Tooltip 
                    content={
                      stat?.users.length 
                      ? <div className="text-center">
                          <div className="font-bold mb-1 text-slate-300 border-b border-slate-700 pb-1">Available ({stat.count})</div>
                          {stat.users.map(u => <div key={u}>{u}</div>)}
                        </div> 
                      : "Click to select"
                    }
                  >
                    <button
                      onClick={() => onToggleSlot(slotId)}
                      className={`w-full h-full transition-colors duration-150 border-transparent border-2 ${getSlotColor(slotId, isSelected)}`}
                    >
                      {/* Visual indicator for "Selected" status */}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeGrid;