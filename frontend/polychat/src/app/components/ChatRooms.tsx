'use client';
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { setActiveRoom } from '../../store/chatSlice';

import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })

type Room = {
  id: string;
  name: string;
  description: string;
  topic: string;
  participants: number;
  is_public: boolean;
};

export default function ChatRooms(){
    const router = useRouter();
    const dispatch = useDispatch();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const [search, setSearch] = useState('');
    const [privateRoomId, setPrivateRoomId] = useState('');
    const [joiningPrivate, setJoiningPrivate] = useState(false);

    useEffect(()=>{
        const fetchRooms = async ()=>{
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            try{
                const res = await fetch('http://localhost:3001/api/chatrooms', {
                    method: 'GET',
                    headers: {Authorization: `Bearer ${token}`,},
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: Room[] = await res.json();
                const publicRooms = data.filter(room => room.is_public);
                setRooms(publicRooms);
            }catch(err){setError((err as Error).message ?? 'Unexpected error');}
            finally{setLoading(false);}
        }
        fetchRooms();
    // },[search])
    },[])

    const handleJoinRoom = async (roomId:string)=>{
        const token = localStorage.getItem('token')
        try{
            const res = await fetch(`http://localhost:3001/api/chatrooms/${roomId}/join`, {
                method: 'POST',
                headers: {Authorization: `Bearer ${token}`,},
            })
            if (!res.ok) throw new Error(`Failed to join room: HTTP ${res.status}`);
            
            dispatch(setActiveRoom(roomId));

            // Redirect user to chat view component for this room
            router.push(`/chat/${roomId}`)
        }catch(err){alert((err as Error).message ?? "Unable to join room.");}
    }

    const handleJoinPrivateRoom = () => {
        const trimmedId = privateRoomId.trim();
        if (!trimmedId) {
        alert('Please enter a room ID');
        return;
        }
        setJoiningPrivate(true);
        handleJoinRoom(trimmedId).finally(() => setJoiningPrivate(false));
    };
    
    return (
    <>
    <div className={`${bodo.className} h-screen w-screen flex items-center justify-center`}>
        <div className="h-full w-2/3 flex flex-col items-center justify-start overflow-hidden">
            <div className={`${bodo.className} text-white text-xl h-[10vh] w-full flex items-center justify-center`}>
                Available Public Chat Rooms
            </div>

            {loading && <div className="text-white">Loading rooms...</div>}
            {error && <div className="text-white">Error: {error}</div>}
            {rooms.length === 0 && !loading && <div className="text-white">No public rooms found.</div>}

            {/* Scrollable list area */}
            <div className="w-full h-[80vh] p-6 overflow-y-auto flex flex-col gap-4 ">
                <ul className="w-full flex flex-col gap-4">
                {rooms.map((room) => (
                    <li
                    key={room.id}
                    className="border border-white rounded-xl px-6 py-4 w-full text-black bg-white"
                    >
                    <div>
                        <span className="font-semibold">Room Name:</span> {room.name}
                    </div>
                    <div className="mt-1">
                        <span className="font-semibold">Description:</span>{' '}
                        <p className="inline">{room.description}</p>
                    </div>
                    <div className="mt-2 text-sm text-black">
                        Topic: <em>{room.topic || 'N/A'}</em> | Visitors: {room.participants}
                    </div>
                    <button
                        className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-200 transition cursor-pointer"
                        onClick={() => handleJoinRoom(room.id)}
                    >
                        Join
                    </button>
                    </li>
                ))}
                </ul>
            </div>
        </div>


        
        
        <div className="h-full w-1/3 flex flex-col items-center justify-center">
            <div className={`${bodo.className} text-white text-xl h-[10vh] w-full flex items-center justify-center`}>Join Private Room</div>
            <div style={{ marginTop: 32 }} className="h-auto w-full flex flex-col items-center justify-center gap-2">
                <input
                    type="text"
                    placeholder="Enter Private Room ID"
                    value={privateRoomId}
                    onChange={e => setPrivateRoomId(e.target.value)}
                    className="border-1 border-white rounded"
                    style={{ padding: 8, width: '300px', marginRight: 8 }}
                    disabled={joiningPrivate}
                />
                <button
                onClick={handleJoinPrivateRoom}
                disabled={joiningPrivate}
                className="bg-white text-black rounded-xl h-[40] w-auto px-4 text-base cursor-pointer"
                >
                Join Private Room
                </button>
            </div>
            <button onClick={() => router.push('/dashboard')} className="fixed bottom-10 right-10 bg-white text-black rounded-xl h-[40] w-auto px-4 text-base cursor-pointer">
                Back to Dashboard
            </button>
        </div>
    </div>
    </>
  );
}