import { Room, User, TimeSlot } from '../types';
import { generateId } from '../utils';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

const ROOMS_COLLECTION = 'rooms';

// Helper to find existing user in a room by name
const findUserInRoom = (room: Room, userName: string): User | undefined => {
  return room.users.find(u => u.name.trim().toLowerCase() === userName.trim().toLowerCase());
};

export const createRoom = async (roomName: string, startDate: string, endDate: string, userName: string): Promise<{ room: Room, user: User }> => {
  const roomId = generateId(); // We can generate ID locally or use doc().id
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

  // Create document in Firestore
  await setDoc(doc(db, ROOMS_COLLECTION, roomId), newRoom);
  
  return { room: newRoom, user: creator };
};

export const joinRoom = async (roomId: string, userName: string): Promise<{ room: Room, user: User }> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("找不到該空間");
  }

  const room = roomSnap.data() as Room;

  // Check if user already exists in room
  let user = findUserInRoom(room, userName);
  
  if (!user) {
    // New user
    user = { id: generateId(), name: userName };
    
    // Update Firestore: Add user to array and init schedule
    await updateDoc(roomRef, {
      users: arrayUnion(user),
      [`schedules.${user.id}`]: [] // Dot notation for updating map field
    });

    // Update local object for return
    room.users.push(user);
    room.schedules[user.id] = [];
  } else {
    // Existing user - ensure schedule array exists
    if (!room.schedules[user.id]) {
       await updateDoc(roomRef, {
        [`schedules.${user.id}`]: []
      });
      room.schedules[user.id] = [];
    }
  }

  return { room, user };
};

// Real-time subscription
export const subscribeToRoom = (roomId: string, onUpdate: (room: Room) => void): Unsubscribe => {
  return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data() as Room);
    }
  });
};

// Find all rooms where the user name exists (Async)
export const getRoomsForUser = async (userName: string): Promise<Room[]> => {
  // Limitations: Firestore array-contains searches for exact objects.
  // Since we store User objects {id, name}, searching by name only is tricky without a separate index or data structure.
  // For this simple app, we will fetch recently created rooms or client-side filter if the dataset is small.
  // BETTER APPROACH: Store a separate 'userNames' array in the document for easier querying.
  // FOR NOW (Compatibility): We will query all rooms (not scalable for production) or just rely on IDs known.
  // 
  // Optimization: Let's assume for this MVP we fetch all rooms and filter. 
  // In a real production app, you would have a 'users_participation' collection.
  
  const q = query(collection(db, ROOMS_COLLECTION));
  const querySnapshot = await getDocs(q);
  const rooms: Room[] = [];
  
  querySnapshot.forEach((doc) => {
    const room = doc.data() as Room;
    if (room.users.some(u => u.name.trim().toLowerCase() === userName.trim().toLowerCase())) {
      rooms.push(room);
    }
  });
  
  return rooms;
};

export const updateSchedule = async (roomId: string, userId: string, slots: TimeSlot[]): Promise<void> => {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  
  await updateDoc(roomRef, {
    [`schedules.${userId}`]: slots
  });
};