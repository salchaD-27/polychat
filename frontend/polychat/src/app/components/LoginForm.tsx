'use client';
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";

import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })

export default function LoginForm(){
    const [message, setMessage] = useState<string|null>(null)
    const {setUser} = useAuth();
    const router = useRouter();
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        setMessage(null);

        // const formData = new FormData(e.currentTarget);
        const form = new FormData(e.currentTarget);
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
        form.append('action', submitter.value); // adding action manually
        const payload = new URLSearchParams();
        form.forEach((value, key) => {
            if (typeof value === 'string'){payload.append(key, value);}
        });
        const response = await fetch('http://localhost:3001/api/auth', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload.toString(),
        });
        const data = await response.json();
        setMessage(data.message?.[0] ?? 'Unexpected response');
        if (!response.ok) {
            setMessage(data.message?.join(' ') || 'Something went wrong');
            return;
        }
        setMessage(data.message?.join(' ') || 'Success');
        
        // store user and token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setUser(data.user);

        router.push('/dashboard');
    }
    return (
        <>
        <div className="h-screen w-screen flex items-center justify-center">
            <div className="w-1/2 h-full flex flex-col items-center justify-center">
                <Image src="/polychatlogowhitenoise.png" alt="polychatlogowhite" fill className="z-0 object-contain object-left"/>
            </div>
            <div className={`w-1/2 h-screen flex flex-col items-center justify-center z-50 text-white ${bodo.className}`}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-80">
                    <div className={`${gira.className} flex items-center justify-center text-center text-4xl mb-4`}>Login to PolyChat</div>
                    <input type="name" name="username" placeholder="Username" required className="p-2 border rounded" />
                    <input type="email" name="email" placeholder="Email" required className="p-2 border rounded" />
                    <input type="password" name="password" placeholder="Password" required className="p-2 border rounded" />
                    <div className="flex justify-between">
                    <button type="submit" name="action" value="login" className="bg-white text-black px-4 py-2 font-bold rounded">Login</button>
                    <button type="submit" name="action" value="signup" className="bg-white text-black px-4 py-2 rounded">Not Registered? <span className="font-bold">Signup</span></button>
                    </div>
                </form>
                {message && <p className="mt-4 text-white">{message}</p>}

                <div className={`flex flex-col items-center justify-center h-auto w-auto mt-20`}>
                    <div className={`${gira.className} flex items-center justify-center text-center text-4xl`}>PolyChat</div>
                    <div className={`${bodo.className} flex items-center justify-center text-center text-lg`}>React.Rust.Go</div>
                </div>
                <div className={`h-auto w-full ${bodo.className} text-base text-center p-10`}>PolyChat is a sophisticated real-time chat platform designed for high performance and seamless user experience. It features a Rust-based WebSocket server that efficiently handles live chat connections, ensuring maximum concurrency and speed. Complementing this, a Go microservice manages user presence, handles pub/sub messaging, and coordinates communication between distributed Rust nodes. On the frontend, PolyChat uses a React and Redux setup to deliver a dynamic, responsive user interface for chatting and room management. All chat metadata and user information are persisted securely in a PostgreSQL database, providing reliable storage and retrieval of room data. This architecture combines modern technologies to deliver a scalable, secure, and real-time communication platform.</div>
                
            </div>
        </div>
        </>
    );
}