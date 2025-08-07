// internal/ws/handler.go
package ws

import (
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

// upgrader upgrades HTTP to WebSocket.
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// HandleWebSocket upgrades and initializes a new client connection.
func HandleWebSocket(pm *PresenceManager, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v\n", err)
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		return
	}

	query := r.URL.Query()
	roomIDs, roomOk := query["roomId"]
	userIDs, userOk := query["userId"]

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

	roomID := strings.TrimSpace(roomIDs[0])
	userID := strings.TrimSpace(userIDs[0])

	client := NewClient(conn, pm, roomID, userID)
	pm.RegisterClient(client)

	go client.writePump()
	go client.readPump()
}
