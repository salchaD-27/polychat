'use client';
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]); // Holds the list of chat messages and connection status messages shown in the UI.
  const [input, setInput] = useState(''); // Holds the current text typed by the user in the input box.
  const ws = useRef<WebSocket|null>(null); // a mutable reference that holds the WebSocket instance or null.
  // useRef is used so the websocket connection persists across re-renders without triggering UI updates.

  useEffect(()=>{
    ws.current = new WebSocket('ws://localhost:8080/ws');
    ws.current.onopen = () => {setMessages((prev) => [...prev, "Connected to server"]);}; // When the WS connection opens successfully, adds "Connected to server" message to the chat.
    ws.current.onmessage = (event: MessageEvent) => {setMessages((prev)=>[...prev, event.data]);} // When a message arrives from the backend, appends the text content to the messages array.
    ws.current.onclose = () => {setMessages((prev) => [...prev, "Disconnected"]);}; // When the WS connection closes, adds "Disconnected" message to the chat.
    return () => ws.current?.close(); // Returns a cleanup function that closes the WebSocket connection when the component unmounts.
  }, [])
  
  const sendMessage = ()=>{ // Triggered when the user wants to send a chat message.
    if (input && ws.current && ws.current.readyState === WebSocket.OPEN) { // Checks that input is not empty, WebSocket connection exists and is open
      ws.current.send(input); // Sends the input string over the WebSocket.
      setInput(''); // Clears the input box afterward.
    }
  }

  return (
    <div className="chat-container">
      <h2>PolyChat MVP</h2>
      <div className="chat-window">
        {messages.map((msg, i) => <div key={i}>{msg}</div>)}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
