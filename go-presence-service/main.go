// cmd/server/main.go
package main

import (
	"go-presence-service/internal/ws"
	"log"
	"net/http"
)

func main() {
	// Create a new presence manager (hub) to manage clients & rooms
	presenceManager := ws.NewPresenceManager()
	// HTTP route for WebSocket connections at /ws
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.HandleWebSocket(presenceManager, w, r)
	})
	// Start the HTTP server on port 8080
	log.Println("Presence service running on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
