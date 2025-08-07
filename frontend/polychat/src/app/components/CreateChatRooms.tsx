'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })

export default function CreateChatRoom() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in.');
        return;
      }

      const res = await fetch('http://localhost:3001/api/chatrooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, topic, description, isPublic }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      router.push(`/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='h-screen w-screen flex items-center justify-center'>
        <div className={`${bodo.className} w-[40vw] min-w-[320px] bg-white rounded-xl p-8 text-black`}>
            <h1 className="text-3xl font-bold mb-6 text-center">Create a Chat Room</h1>
            <form onSubmit={handleCreateRoom} className="space-y-5">
                {/* Room Name */}
                <div>
                <label className="block mb-1 font-medium">Room Name *</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-1 border-black rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-black/50"
                    placeholder="Room Name"
                />
                </div>

                {/* Topic */}
                <div>
                <label className="block mb-1 font-medium">Topic</label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-transparent border-1 border-black rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-black/50"
                    placeholder="Room Topic"
                />
                </div>

                {/* Description */}
                <div>
                <label className="block mb-1 font-medium">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-1 border-black rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-black/50 resize-none"
                    placeholder="Room Description"
                    rows={3}
                />
                </div>

                {/* Public Room Checkbox */}
                <div>
                <label className="inline-flex items-center gap-2">
                    <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="accent-black"
                    />
                    Public Room
                </label>
                </div>

                {/* Error */}
                {error && <p className="text-red-400 text-sm">{error}</p>}

                {/* Submit */}
                <button
                type="submit"
                disabled={loading}
                className="w-full bg-black cursor-pointer text-white font-semibold py-2 rounded transition"
                >
                {loading ? 'Creating...' : 'Create Room'}
                </button>
            </form>
        </div>
    </div>
  );
}
