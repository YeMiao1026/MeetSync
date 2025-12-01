import React, { useState, useEffect, useCallback } from 'react';
import { User, Room, ViewState, TimeSlot } from './types';
import { formatDate } from './utils';
import * as storage from './services/storage';
import Button from './components/Button';
import Input from './components/Input';
import TimeGrid from './components/TimeGrid';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  
  // State for identifying the current session user name
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  // App State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Inputs
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomName, setRoomName] = useState('');
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(formatDate(new Date(new Date().setDate(new Date().getDate() + 5))));

  // Real-time listener for Room View
  useEffect(() => {
    let unsubscribe: () => void;

    if (view === 'ROOM' && currentRoom?.id) {
      unsubscribe = storage.subscribeToRoom(currentRoom.id, (updatedRoom) => {
        // Only update if data actually changed to prevent loops (though Firestore handles this well)
        setCurrentRoom(updatedRoom);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [view, currentRoom?.id]);

  // Load user rooms when entering Dashboard
  useEffect(() => {
    const fetchRooms = async () => {
      if (view === 'DASHBOARD' && currentUserName) {
        setLoading(true);
        try {
          const rooms = await storage.getRoomsForUser(currentUserName);
          setUserRooms(rooms);
        } catch (error) {
          console.error("Failed to fetch rooms", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchRooms();
  }, [view, currentUserName]);

  const handleLogin = (name: string) => {
    if (!name.trim()) {
      alert("請輸入姓名");
      return;
    }
    setCurrentUserName(name.trim());
    setView('DASHBOARD');
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !startDate || !endDate) {
      alert("請填寫所有欄位");
      return;
    }
    if (startDate > endDate) {
      alert("結束日期必須晚於開始日期");
      return;
    }

    setLoading(true);
    try {
      // Pass the name, let storage handle user creation
      const { room, user } = await storage.createRoom(roomName, startDate, endDate, currentUserName);
      
      setCurrentUser(user);
      setCurrentRoom(room);
      setView('ROOM');
    } catch (error) {
      console.error(error);
      alert("建立空間失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomIdInput.trim()) {
      alert("請輸入空間 ID");
      return;
    }
    setLoading(true);
    try {
      const { room, user } = await storage.joinRoom(roomIdInput.trim(), currentUserName);
      setCurrentUser(user);
      setCurrentRoom(room);
      setView('ROOM');
    } catch (e) {
      alert("找不到此空間 ID，請確認後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterExistingRoom = async (roomId: string) => {
    setLoading(true);
    try {
      const { room, user } = await storage.joinRoom(roomId, currentUserName);
      setCurrentUser(user);
      setCurrentRoom(room);
      setView('ROOM');
    } catch (e) {
      alert("進入空間發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = useCallback(async (slotId: TimeSlot) => {
    if (!currentRoom || !currentUser) return;

    const mySlots = currentRoom.schedules[currentUser.id] || [];
    let newSlots;
    if (mySlots.includes(slotId)) {
      newSlots = mySlots.filter(s => s !== slotId);
    } else {
      newSlots = [...mySlots, slotId];
    }

    // Optimistic UI update (optional, but good for UX)
    const updatedRoom = {
      ...currentRoom,
      schedules: {
        ...currentRoom.schedules,
        [currentUser.id]: newSlots
      }
    };
    setCurrentRoom(updatedRoom);

    // Persist to Firebase
    try {
      await storage.updateSchedule(currentRoom.id, currentUser.id, newSlots);
    } catch (error) {
      console.error("Failed to update schedule", error);
      // Revert logic could go here
    }
  }, [currentRoom, currentUser]);

  const handleCopyLink = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    alert("空間 ID 已複製到剪貼簿！分享給朋友即可加入。");
  };

  // --- Views ---

  if (view === 'LANDING') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">MeetSync</h1>
            <p className="text-slate-500">簡約、高效的多人時間排程工具</p>
          </div>
          
          <Input 
            label="您的姓名" 
            placeholder="Ex: Jay" 
            className="mb-6"
            id="username-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin((e.target as HTMLInputElement).value);
              }
            }}
          />

          <Button 
            fullWidth 
            onClick={() => {
              const name = (document.getElementById('username-input') as HTMLInputElement).value;
              handleLogin(name);
            }}
          >
            進入
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">歡迎回來，{currentUserName}</h2>
              <p className="text-slate-500">選擇一個空間開始排程，或建立新的空間</p>
            </div>
            <Button variant="outline" onClick={() => setView('LANDING')} className="text-sm">
              切換使用者
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Action Cards */}
            <div className="col-span-1 space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-slate-900 mb-2">建立新空間</h3>
                <p className="text-sm text-slate-500 mb-4">發起一個新的時間調查，設定日期範圍。</p>
                <Button fullWidth onClick={() => setView('CREATE')}>
                  ＋ 建立
                </Button>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-slate-900 mb-2">加入空間</h3>
                <p className="text-sm text-slate-500 mb-4">擁有空間 ID？直接輸入代碼加入。</p>
                <Button fullWidth variant="secondary" onClick={() => setView('JOIN')}>
                  → 加入
                </Button>
              </div>
            </div>

            {/* Room List */}
            <div className="col-span-1 md:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">我的空間 ({userRooms.length})</h3>
                  {loading && <span className="text-xs text-indigo-500">載入中...</span>}
                </div>
                
                {!loading && userRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p>尚未加入任何空間</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {userRooms.map((room) => (
                      <div 
                        key={room.id} 
                        onClick={() => handleEnterExistingRoom(room.id)}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {room.name}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              📅 {room.startDate} ~ {room.endDate}
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              {room.users.length} 人
                            </span>
                          </div>
                        </div>
                        <div className="text-slate-300 group-hover:text-indigo-500">
                          →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (view === 'CREATE') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <button onClick={() => setView('DASHBOARD')} className="text-slate-400 hover:text-slate-600 mb-4 text-sm flex items-center">
            ← 返回儀表板
          </button>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">建立新空間</h2>
          
          <div className="space-y-4">
            <Input 
              label="空間名稱" 
              placeholder="Ex: 專案會議" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <div className="flex gap-4">
              <Input 
                label="開始日期" 
                type="date" 
                value={startDate}
                min={formatDate(new Date())}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input 
                label="結束日期" 
                type="date" 
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="pt-4">
              <Button fullWidth onClick={handleCreateRoom} disabled={loading}>
                {loading ? '建立中...' : '開始排程'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'JOIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <button onClick={() => setView('DASHBOARD')} className="text-slate-400 hover:text-slate-600 mb-4 text-sm flex items-center">
            ← 返回儀表板
          </button>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">加入現有空間</h2>
          
          <div className="space-y-4">
            <Input 
              label="空間 ID" 
              placeholder="貼上朋友分享的 ID" 
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
            />
            
            <div className="pt-4">
              <Button fullWidth variant="secondary" onClick={handleJoinRoom} disabled={loading}>
                {loading ? '加入中...' : '進入空間'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Room View
  if (view === 'ROOM' && currentRoom && currentUser) {
    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
               <button onClick={() => setView('DASHBOARD')} className="text-slate-400 hover:text-slate-600 text-sm md:hidden">
                ←
               </button>
               <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {currentRoom.name}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-normal border border-slate-200">
                  {currentRoom.users.length} 人在線
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 ml-4 md:ml-0">
              ID: <span className="font-mono select-all bg-slate-100 px-1 rounded">{currentRoom.id}</span>
            </p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={handleCopyLink} className="text-sm py-2">
               複製 ID
             </Button>
             <Button variant="primary" onClick={() => setView('DASHBOARD')} className="text-sm py-2 bg-slate-200 text-slate-700 hover:bg-slate-300">
               回到列表
             </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden p-4 gap-4">
          
          {/* Sidebar: Users Legend */}
          <aside className="hidden md:block w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">參與者</h3>
            <div className="space-y-3">
              {currentRoom.users.map(u => {
                const isMe = u.id === currentUser.id;
                const slotCount = currentRoom.schedules[u.id]?.length || 0;
                return (
                  <div key={u.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isMe ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm ${isMe ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                        {u.name} {isMe && '(你)'}
                      </span>
                    </div>
                    {slotCount > 0 && (
                      <span className="text-xs text-slate-400">{slotCount} selected</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">圖例</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-800 border border-slate-900"></div>
                  <span>您的選擇</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-indigo-500"></div>
                  <span>高人氣時段</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-indigo-200"></div>
                  <span>少數人選擇</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-slate-200 bg-white"></div>
                  <span>無人選擇</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Grid Area */}
          <main className="flex-1 min-w-0 flex flex-col">
            <TimeGrid 
              room={currentRoom} 
              currentUser={currentUser} 
              onToggleSlot={handleToggleSlot} 
            />
          </main>
        </div>
      </div>
    );
  }

  return null;
};

export default App;