'use client';
import { useEffect, useState } from "react";
import LoginForm from "../components/LoginForm";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })

export default function Login() {
  const router = useRouter();
  const {isLoggedIn} = useAuth();
  useEffect(()=>{
    if(isLoggedIn){router.push('/dashboard');}
  }, [isLoggedIn, router]);

  return (
    <div className="w-screen h-screen flex items-center justify-center text-white">
      <LoginForm/>
    </div>
  );
}
