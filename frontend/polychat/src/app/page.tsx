'use client';
import {useRouter} from "next/navigation";
import { useAuth } from "./context/AuthContext";
import Image from 'next/image';
import DashboardIcon from "./components/DashboardIcon";
import LoginIcon from "./components/LoginIcon";


import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })

export default function Home() {
  const router = useRouter();
  const {isLoggedIn} = useAuth();

  const handleLoginOrDashboard = () => {
    if (isLoggedIn) {router.push('/dashboard');}
    else {router.push('/login');}
  };

  return (
    <>
    {/* header */}
    <div className="fixed w-[100vw] h-[10vh] top-0 left-0 z-[10] flex items-center justify-between px-10 py-2 backdrop-blur-md bg-transparent/30">
      <div className={`flex flex-col items-center justify-center h-full w-auto`}>
        <div className={`${gira.className} flex items-center justify-center text-center text-4xl`}>PolyChat</div>
        <div className={`${bodo.className} flex items-center justify-center text-center text-lg`}>React.Rust.Go</div>
      </div>
      <div className="flex items-center justify-center h-full w-auto">
        <button className="w-auto h-[1/2] bg-black text-white text-base cursor-pointer" onClick={handleLoginOrDashboard}>{isLoggedIn?<DashboardIcon/>:<LoginIcon/>}</button>
      </div>
    </div>

    <div className="w-screen h-screen flex items-center justify-center text-white">
      <div className="h-full w-1/2 flex items-center justify-center"><Image src="/polychatlogowhitenoise.png" alt="polychatlogowhite" fill className="object-contain object-left"/></div>
      <div className="h-full w-1/2 flex flex-col items-center justify-center">
        <p className={`${bodo.className} text-7xl`}>Chat. Privately.</p>
        <div className="h-auto w-full flex items-center justify-center gap-4">
          <p className={`${gira.className} h-full w-auto text-[20vh] text-right `}>NO</p> 
          <div className="h-auto w-auto flex flex-col items-start justify-center text-left">
            <p className={`${bodo.className} text-6xl`}>Message</p>
            <p className={`${bodo.className} text-6xl`}>History</p>
          </div>
        </div>
        <div className="h-auto w-full flex items-center justify-center gap-4">
          <p className={`${gira.className} h-full w-auto text-9xl text-right `}>FULL</p> 
          <div className="h-auto w-auto flex flex-col items-start justify-center text-left">
            <p className={`${bodo.className} text-4xl`}>End-to-End</p>
            <p className={`${bodo.className} text-5xl`}>Encryption</p>
          </div>
        </div>
      </div>
    </div>
    <div className="w-screen h-[60vh] flex flex-col items-center justify-center text-white">
      <div className={`h-auto w-full flex items-center justify-center ${gira.className} text-4xl`}>PolyChat</div>
      <div className={`h-auto w-full flex items-center justify-center ${bodo.className} text-2xl`}>a real-time chat platform featuring</div>
      <div className={`h-auto w-full flex items-center justify-center ${bodo.className}`}>
        <div className={`h-full w-1/4 flex flex-col items-center justify-center p-10 text-center text-xl`}>
          <Image src="/rustlogowhite.png" alt="polychatlogowhite" height={100} width={100} className=""/>
          <div>Rust-based WebSocket server for handling live chat connections with performance and concurrency</div>
        </div>
        <div className={`h-full w-1/4 flex flex-col items-center justify-center p-10 text-center text-xl`}>
          <Image src="/gologowhite.png" alt="polychatlogowhite" height={140} width={140} className=""/>
          <div>Go microservice to manage user presence, handle pub/sub messaging, and coordinate between distributed Rust nodes</div>
        </div>
        <div className={`h-full w-1/4 flex flex-col items-center justify-center p-10 text-center text-xl`}>
          <Image src="/reactlogowhite.png" alt="polychatlogowhite" height={100} width={100} className=""/>
          <div>React + Redux frontend for the user interface</div>
        </div>
        <div className={`h-full w-1/4 flex flex-col items-center justify-center p-10 text-center text-xl`}>
          <Image src="/postgresqllogowhite.png" alt="polychatlogowhite" height={100} width={100} className=""/>
          <div>PostgreSQL database to persist chat metadata</div>
        </div>
      </div>
      <div className="h-[10vh] w-full"></div>
    </div>

    <div className="h-[50vh] w-full bg-white text-black flex items-center justify-center">
      <div className="h-full w-1/3 flex flex-col items-center justify-center">
        <Image src="/polychatlogoblack.png" alt="polychatlogowhite" height={200} width={200} className=""/>
        <div className={`flex flex-col items-center justify-center`}>
            <div className={`${gira.className} flex items-center justify-center text-center text-4xl`}>PolyChat</div>
            <div className={`${bodo.className} flex items-center justify-center text-center text-lg`}>React.Rust.Go</div>
        </div>
      </div>
      <div className="h-full w-2/3 flex items-center justify-center">
        <div className={`h-auto w-full ${bodo.className} text-base text-center p-10`}>PolyChat is a sophisticated real-time chat platform designed for high performance and seamless user experience. It features a Rust-based WebSocket server that efficiently handles live chat connections, ensuring maximum concurrency and speed. Complementing this, a Go microservice manages user presence, handles pub/sub messaging, and coordinates communication between distributed Rust nodes. On the frontend, PolyChat uses a React and Redux setup to deliver a dynamic, responsive user interface for chatting and room management. All chat metadata and user information are persisted securely in a PostgreSQL database, providing reliable storage and retrieval of room data. This architecture combines modern technologies to deliver a scalable, secure, and real-time communication platform.</div>
      </div>
    </div>
    </>
  );
}
