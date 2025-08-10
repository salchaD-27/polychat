// WebSocket connection handler for Go application

// Sequence:
// HTTP request received at /ws?roomId=abc&userId=u123.
// Upgraded to a WebSocket.
// IDs extracted and validated.
// New Client created and registered in PresenceManager.
// Client’s reader and writer goroutines started:
// Receives messages (reads).
// Sends messages (writes).
// All room messaging and presence logic is now managed by PresenceManager and the client’s pumps.

package ws

import (
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

// a struct from the Gorilla WebSocket library used to convert ("upgrade") an HTTP request into a WebSocket connection.
var upgrader = websocket.Upgrader{
	// CheckOrigin always returns true, allowing connections from any origin (can tighten security in production).
	CheckOrigin: func(r *http.Request) bool { return true },
}

// HandleWebSocket upgrades an incoming HTTP request to a WebSocket, extracts key parameters (room and user IDs), creates a new client, and starts its message handling routines.
// pm: the shared PresenceManager instance, which handles all clients and rooms (see previous answer).
// w, r: HTTP response writer and request.
func HandleWebSocket(pm *PresenceManager, w http.ResponseWriter, r *http.Request) {
	// Step 1: Upgrading connection, initiates the WebSocket handshake (protocol upgrade).
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v\n", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}
	// Step 2: Parse Query Parameters
	query := r.URL.Query()
	roomIDs, roomOk := query["roomId"]
	userIDs, userOk := query["userId"]

	// Step 3: Validating Parameters
	if !roomOk || len(roomIDs[0]) == 0 {
		log.Println("Missing roomId query parameter")
		conn.Close()
		return
	}
	if !userOk || len(userIDs[0]) == 0 {
		log.Println("Missing userId query parameter")
		conn.Close()
		return
	}
	// Step 4: Clean Up IDs
	roomID := strings.TrimSpace(roomIDs[0])
	userID := strings.TrimSpace(userIDs[0])
	// Step 5: Create and Register Client
	client := NewClient(conn, pm, roomID, userID)
	pm.RegisterClient(client)
	// Step 6: Launch Client Pumps
	// 	Runs the client’s writePump and readPump concurrently in new goroutines (background threads).
	// readPump: constantly reads messages from the socket (from the user) and broadcasts them to the room.
	// writePump: sends messages (and pings) from the room to the user via the socket.
	go client.writePump()
	go client.readPump()
}
