import { Room, User, TimeSlot } from '../types';
import { generateId } from '../utils';

const STORAGE_KEY = 'meetsync_rooms';

const getRooms = (): Record<string, Room> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveRooms = (rooms: Record<string, Room>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

// Helper to find existing user in a room by name
const findUserInRoom = (room: Room, userName: string): User | undefined => {
  return room.users.find(u => u.name.trim().toLowerCase() === userName.trim().toLowerCase());
};

export const createRoom = (roomName: string, startDate: string, endDate: string, userName: string): { room: Room, user: User } => {
  const rooms = getRooms();
  const roomId = generateId();
  const userId = generateId();
  
  const creator: User = { id: userId, name: userName };

  const newRoom: Room = {
    id: roomId,
    name: roomName,
    startDate,
    endDate,
    createdBy: userId,
    users: [creator],
    schedules: {
      [userId]: []
    }
  };

  rooms[roomId] = newRoom;
  saveRooms(rooms);
  return { room: newRoom, user: creator };
};

export const joinRoom = (roomId: string, userName: string): { room: Room, user: User } => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) {
    throw new Error("找不到該空間");
  }

  // Check if user already exists in room
  let user = findUserInRoom(room, userName);
  
  if (!user) {
    // New user
    user = { id: generateId(), name: userName };
    room.users.push(user);
    // Initialize schedule if not exists
    if (!room.schedules[user.id]) {
      room.schedules[user.id] = [];
    }
  } else {
    // Existing user - ensure schedule array exists (just in case)
    if (!room.schedules[user.id]) {
      room.schedules[user.id] = [];
    }
  }

  rooms[roomId] = room;
  saveRooms(rooms);
  return { room, user };
};

export const getRoom = (roomId: string): Room | null => {
  const rooms = getRooms();
  return rooms[roomId] || null;
};

// Find all rooms where the user name exists
export const getRoomsForUser = (userName: string): Room[] => {
  const rooms = getRooms();
  return Object.values(rooms).filter(room => 
    room.users.some(u => u.name.trim().toLowerCase() === userName.trim().toLowerCase())
  );
};

export const updateSchedule = (roomId: string, userId: string, slots: TimeSlot[]): Room => {
  const rooms = getRooms();
  const room = rooms[roomId];

  if (!room) {
    throw new Error("Room not found");
  }

  room.schedules[userId] = slots;
  rooms[roomId] = room;
  saveRooms(rooms);
  return room;
};