import { useAuth } from '../context/AuthContext'
import { Bodoni_Moda, Bodoni_Moda_SC, Girassol } from 'next/font/google'
const bodo = Bodoni_Moda({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const bodosc = Bodoni_Moda_SC({weight: ['400','500','600','700','800','900'], style: ['normal', 'italic'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })
const gira = Girassol({weight: ['400'], style: ['normal'], subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-p', adjustFontFallback: true })


export default function DashboardIcon(){
    const {user} = useAuth();
    const firstLetter = user?.username.charAt(0).toUpperCase();
    return(
        <div className={`h-[40] w-auto px-4 flex items-center justify-center rounded-xl bg-white text-black text-lg ${bodo.className}`}>Welcome,&nbsp;<span className={`${gira.className} font-bold text-xl`}>{firstLetter}</span>!</div>
    );
}