'use client';
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { setActiveRoom } from '../../../store/chatSlice';
import type { RootState } from '../../../store/store';
import { v4 as uuidv4 } from 'uuid';

import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })

type Message = {
  id: string;
  sender?: { id: string; username: string };
  content: string;
  timestamp: string;
  system?: boolean;
};

type User = {
  id: string;
  username: string;
  online: boolean;
};

export default function ChatRoomIdPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useParams();
  const roomId = params.roomId;
  const activeRoomId = useSelector((state: RootState) => state.chat.activeRoomId);
  const { user } = useAuth();

  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof roomId === 'string') {
      dispatch(setActiveRoom(roomId));
    }
  }, [roomId, dispatch]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open WebSocket connection
  useEffect(() => {
    if (typeof roomId !== 'string') return;
    const token = localStorage.getItem('token');
    if (!token || !user?.id) return;

    const tokenEncoded = encodeURIComponent(token);
    const userIdEncoded = encodeURIComponent(String(user.id));
    ws.current = new WebSocket(`ws://localhost:8080/ws?roomId=${roomId}&token=${tokenEncoded}&userId=${userIdEncoded}`);

    ws.current.onopen = () => {
      console.log('Connected to room:', roomId);
    };
    ws.current.onclose = (e) => {
      console.log('Disconnected from room:', e.reason || e.code);
    };
    ws.current.onerror = (e) => {
      console.error('WebSocket error:', e);
    };
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chatMessage' && isValidMessage(data.message)) {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'presenceUpdate' && Array.isArray(data.members)) {
          setMembers(data.members);
        } else if (data.type === 'user_joined') {
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            content: `${data.userName} has joined the room.`,
            timestamp: new Date().toISOString(),
            system: true,
          }]);
        } else if (data.type === 'user_left') {
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            content: `${data.userName} has left the room.`,
            timestamp: new Date().toISOString(),
            system: true,
          }]);
        } else {
          console.warn('Unexpected WS data:', data);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    return () => { ws.current?.close(); };
  }, [roomId, user]);

  // Fetch chat history once on mount
  useEffect(() => {
    if (typeof roomId !== 'string') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    async function fetchMessages() {
      try {
        const res = await fetch(`http://localhost:3001/api/chatrooms/${roomId}/messages`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const validMessages = data.filter(isValidMessage);
          setMessages(validMessages);
          if (validMessages.length < data.length) {
            console.warn('Some fetched messages were invalid and discarded.');
          }
        } else {
          console.warn('Fetched messages data was not an array:', data);
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setMessages([]);
      }
    }
    fetchMessages();
  }, [roomId]);

  // Fetch room members
  useEffect(() => {
    if (typeof roomId !== 'string') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    async function fetchMembers() {
      try {
        const res = await fetch(`http://localhost:3001/api/chatrooms/${roomId}/members`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMembers(data);
        } else {
          console.warn('Fetched members data was not an array:', data);
          setMembers([]);
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
        setMembers([]);
      }
    }
    fetchMembers();
  }, [roomId]);

  // Validate message shape
  function isValidMessage(msg: any): msg is Message {
    if (!msg || typeof msg.id !== 'string' || typeof msg.content !== 'string' || typeof msg.timestamp !== 'string') {
      return false;
    }
    if (msg.system) return true;
    return msg.sender && typeof msg.sender.username === 'string';
  }

  const sendMessage = () => {
    if (input.trim() && ws.current && ws.current.readyState === WebSocket.OPEN && user) {
      const message = {
        type: 'chatMessage',
        message: {
          id: uuidv4(),
          sender: {
            id: user.id,
            username: user.username,
          },
          content: input.trim(),
          timestamp: new Date().toISOString(),
        }
      };
      ws.current.send(JSON.stringify(message));
      setInput('');
    }
  };

  return (
    <>
    <div className={`${bodo.className} h-[100vh] w-screen flex flex-col items-center justify-center`}>
      <div className={`${bodo.className} h-[10vh] w-full flex items-center justify-between p-10`}>
        <div><span className="font-bold">Chat RoomId:</span> {roomId}</div>
        <button
          onClick={() => router.push('/chatrooms')}
          className="bg-white text-black rounded-xl h-[40] px-4 w-auto cursor-pointer"
        >
          Exit Room
        </button>
      </div>
      <div className="h-[90vh] w-full flex items-start justify-center">
        <div className="h-auto w-1/5 flex items-center justify-center">
          <section>
            <h3 className="font-bold text-lg">Members ({members.length}):</h3>
            <ul>
              {members.map(m => (
                <li className='text-base' key={m.id}>{m.username}</li>
              ))}
            </ul>
          </section>
        </div>
        <div className="h-full w-4/5 flex flex-col items-center justify-center px-10">
            <div className="bg-white text-black h-4/5 w-full p-10 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className="text-base text-black mb-2">
                  {msg.system ? (
                    <em>{msg.content}</em>
                  ) : (
                    <>
                      <b>{msg.sender?.username}</b>: {msg.content}{' '}
                      <small>({new Date(msg.timestamp).toLocaleTimeString()})</small>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="h-1/5 w-full flex items-center justify-center gap-4">
              <input
                type="text"
                placeholder="Type your message"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className="h-[40] w-full px-4 rounded text-white placeholder-white/50 border-1 border-white"
              />
              <button
                onClick={sendMessage}
                className="h-[40] w-auto px-4 text-base text-black bg-white rounded-xl cursor-pointer"
              >
                Send
              </button>
            </div>
        </div>
      </div>
    </div>
    <div style={{ padding: '16px' }}>
    </div>
    </>
  );
}
