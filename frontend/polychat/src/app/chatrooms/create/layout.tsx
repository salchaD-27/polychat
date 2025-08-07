import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Room - PolyChat",
  description: "",
};

export default function ChatRoomLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <>
      {children}
    </>
  );
}
