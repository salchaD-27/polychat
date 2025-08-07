'use client';
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChatRooms from "../components/ChatRooms";

export default function Chatrooms() {
  return (
    <ChatRooms/>
  );
}
