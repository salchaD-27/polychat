'use client';
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CreateChatRooms from "../../components/CreateChatRooms";

export default function CreateChatrooms() {
  return (
    <CreateChatRooms/>
  );
}
