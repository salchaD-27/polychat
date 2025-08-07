'use client';
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { setActiveRoom } from '../../store/chatSlice'; 

import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })


type ChatRoom = {
  id: string;
  name: string;
  description: string;
  topic: string;
  is_public: boolean;
  participants: number;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const {user, logout} = useAuth();
  // Connection status: connecting | connected | disconnected | error
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const [messages, setMessages] = useState<string[]>([]); // Holds the list of chat messages and connection status messages shown in the UI.
  const [input, setInput] = useState(''); // Holds the current text typed by the user in the input box.
  const ws = useRef<WebSocket|null>(null); // a mutable reference that holds the WebSocket instance or null.
  // useRef is used so the websocket connection persists across re-renders without triggering UI updates.

  const [myRooms, setMyRooms] = useState<ChatRoom[]>([]);
  // Fetch user's rooms
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:3001/api/chatrooms/mine', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMyRooms(data);
        } else {
          console.warn('Expected array but got:', data);
          setMyRooms([]); // fallback to empty array
        }
      })
      .catch(err => {
        console.error('Failed to fetch rooms:', err);
        setMyRooms([]); // fallback to empty array on error
      });
  }, [user]);

  // Render connection status with color indicators
  const renderStatusIndicator = () => {
    let color = "";
    let text = "";
    switch (connectionStatus) {
      case "connecting":
        color = "orange";
        text = "Connecting...";
        break;
      case "connected":
        color = "green";
        text = "Connected";
        break;
      case "disconnected":
        color = "red";
        text = "Disconnected";
        break;
      case "error":
        color = "red";
        text = "Connection Error";
        break;
      };
    return (
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ 
          width: 12, height: 12, borderRadius: "50%", backgroundColor: color, display: "inline-block", marginRight: "6px" 
        }} />
        <span>{text}</span>
      </div>
    );
  }

  // useEffect(()=>{
  //   ws.current = new WebSocket('ws://localhost:8080/ws');
  //   setConnectionStatus("connecting");
  //   ws.current.onopen = () => { // When the WS connection opens successfully, adds "Connected to server" message to the chat.
  //     setConnectionStatus("connected");
  //     setMessages((prev) => [...prev, "Connected to server"]);
  //   };
  //   ws.current.onmessage = (event: MessageEvent) => {setMessages((prev)=>[...prev, event.data]);} // When a message arrives from the backend, appends the text content to the messages array.
  //   ws.current.onclose = () => { // When the WS connection closes, adds "Disconnected" message to the chat.
  //     setConnectionStatus("disconnected");
  //     setMessages((prev) => [...prev, "Disconnected"]);
  //   };
  //   ws.current.onerror = () => {
  //     setConnectionStatus("error");
  //     setMessages(prev => [...prev, "Connection error"]);
  //   };
  //   return () => ws.current?.close(); // Returns a cleanup function that closes the WebSocket connection when the component unmounts.
  // }, [])
  useEffect(() => {
    console.log("Attempting to connect WebSocket");
    ws.current = new WebSocket('ws://localhost:8080/ws');
    setConnectionStatus("connecting");

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus("connected");
      setMessages((prev) => [...prev, "Connected to server"]);
    };

    ws.current.onmessage = (event: MessageEvent) => {
      console.log('WebSocket message received:', event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    ws.current.onclose = (e) => {
      console.log('WebSocket disconnected', e);
      setConnectionStatus("disconnected");
      setMessages((prev) => [...prev, "Disconnected"]);
    };

    ws.current.onerror = (e) => {
      console.error('WebSocket error', e);
      setConnectionStatus("error");
      setMessages((prev) => [...prev, "Connection error"]);
    };

    return () => {
      console.log('Cleaning up WebSocket connection');
      ws.current?.close();
    };
  }, []);

  const sendMessage = ()=>{ // Triggered when the user wants to send a chat message.
    if (input && ws.current && ws.current.readyState === WebSocket.OPEN) { // Checks that input is not empty, WebSocket connection exists and is open
      ws.current.send(input); // Sends the input string over the WebSocket.
      setInput(''); // Clears the input box afterward.
    }
  }
  const handleLogout = ()=>{
    logout();
    router.push('/')
  }

  const handleJoinRoom = async (roomId: string) => {
    setJoiningRoomId(roomId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/chatrooms/${roomId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to join room: HTTP ${res.status}`);

      dispatch(setActiveRoom(roomId)); // update redux store active room
      router.push(`/chat/${roomId}`);
    } catch (err) {
      alert((err as Error).message ?? 'Unable to join room.');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleJoinPrivateRoom = async (roomId: string) => {
    setJoiningRoomId(roomId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/chatrooms/${roomId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to join private room: HTTP ${res.status}`);
      }
      dispatch(setActiveRoom(roomId)); // update redux store active room
      router.push(`/chat/${roomId}`);
    } catch (err) {
      alert((err as Error).message ?? 'Unable to join private room.');
    } finally {
      setJoiningRoomId(null);
    }
  };
  
  if(!user){return <p>Loading user...</p>;}
  return (
    <div className={`${bodo.className} w-screen h-screen text-white flex flex-col items-center justify-center`}>
      <div className="fixed h-[10vh] w-full p-10 top-0 left-0 text-2xl flex items-center justify-between">
        <div className="text-2xl">Welcome, <span className={`${gira.className} font-bold text-3xl`}>{user.username}</span>!</div>
        <div className="h-full w-auto flex items-center justify-center gap-2">
          <Link href={'/chatrooms'}><button className="bg-white text-black h-[40] px-4 text-base rounded-xl cursor-pointer">Public Rooms</button></Link>
          <Link href={'/chatrooms/create'}><button className="bg-white text-black h-[40] px-4 text-base rounded-xl cursor-pointer">Create Room</button></Link>
        </div>
        <div className="h-full w-auto flex items-center justify-center text-sm gap-2">
          {renderStatusIndicator()}
          <button className="bg-white text-black h-[40] w-auto text-base flex items-center justify-center font-bold px-4 rounded-xl cursor-pointer" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* User's Created Chat Rooms */}
      <div className={`${bodo.className} w-full max-w-2xl bg-white text-black p-4 rounded shadow`}>
        <h2 className="text-xl font-semibold mb-2">Your Rooms</h2>
        {myRooms.length === 0 ? (
          <p className="text-gray-600">You haven't created any chat rooms yet.</p>
        ) : (
          <ul className="space-y-3">
            {myRooms.map(room => (
              <li key={room.id} className="bg-black text-white p-4 rounded-xl shadow">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex flex-col items-start justify-center gap-1">
                    <h3 className="text-lg font-bold">{room.name}</h3>
                    <p className="text-sm text-white">Topic: {room.topic || "None"}</p>
                    <p className="text-sm text-white">Description: {room.description || "No description"}</p>
                    <p className="text-sm text-white">Visitors: {room.participants}</p>
                    <p className="text-sm text-white">Visibility: {room.is_public ? 'Public' : 'Private'}</p>
                    <p className="text-sm text-white">Created: {new Date(room.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => room.is_public?handleJoinRoom(room.id):handleJoinPrivateRoom(room.id)}
                    disabled={joiningRoomId === room.id}
                    className="bg-white text-black px-3 py-1 rounded text-sm"
                  >
                    {joiningRoomId === room.id ? 'Joining...' : 'Open'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      
      {/* Fetch more user info or show dashboard-specific UI */}
    </div>
  );
}
