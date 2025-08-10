// core presence management for WebSocket system.
package ws

import (
	"encoding/json"
	"log"
	"sync"
)

type UserStatus string

const (
	StatusOnline  UserStatus = "online"
	StatusAway    UserStatus = "away"
	StatusOffline UserStatus = "offline"
)

// PresenceManager manages clients grouped by room.
type PresenceManager struct {
	mu    sync.RWMutex // Read/Write mutex for thread‑safe access from concurrent goroutines.
	rooms map[string]map[*Client]struct{}
	// Key: roomID string.
	// Value: a set (map with empty struct value) of pointers to Client structs connected to that room.
}

// constructor
func NewPresenceManager() *PresenceManager {
	return &PresenceManager{
		rooms: make(map[string]map[*Client]struct{}),
	}
}

// Registering a client
func (pm *PresenceManager) RegisterClient(client *Client) error {
	if client == nil {
		return nil
	}
	// Thread‑safe lock -> ensures multiple clients can join concurrently without race conditions.
	pm.mu.Lock()
	defer pm.mu.Unlock()

	// If room doesn't exist yet, create it.
	if _, exists := pm.rooms[client.RoomID]; !exists {
		pm.rooms[client.RoomID] = make(map[*Client]struct{})
	}
	pm.rooms[client.RoomID][client] = struct{}{} // Add client pointer to that room’s set.
	client.Status = StatusOnline                 // Set client’s Status to "online".
	// Log the join.
	log.Printf("Client userID=%s joined room=%s", client.UserID, client.RoomID)
	// Fire broadcastPresence in its own goroutine to let everyone in that room know who’s now connected.
	go pm.broadcastPresence(client.RoomID)
	return nil
}

func (pm *PresenceManager) UnregisterClient(client *Client) error {
	if client == nil {
		return nil
	}

	pm.mu.Lock()
	defer pm.mu.Unlock()

	clients, exists := pm.rooms[client.RoomID]
	if !exists {
		return nil
	}
	// Removes the client from the room’s set.
	delete(clients, client)
	log.Printf("Client userID=%s left room=%s", client.UserID, client.RoomID)
	// If that room is now empty, delete the room entry.
	if len(clients) == 0 {
		delete(pm.rooms, client.RoomID)
	}
	// Broadcast updated member list
	go pm.broadcastPresence(client.RoomID)
	return nil
}

// Broadcasting Presence Updates
// Gathers all client info in the room into a list.
// Marshals into JSON with type "presenceUpdate" and member list.
// Sends to every client's send channel.
// If send is blocked (buffer full) -> assume client is stuck/unresponsive -> unregister and disconnect it.
func (pm *PresenceManager) broadcastPresence(roomID string) {
	pm.mu.RLock()
	clients, exists := pm.rooms[roomID]
	pm.mu.RUnlock()
	if !exists {
		return
	}

	type memberInfo struct {
		ID       string     `json:"id"`
		Username string     `json:"username"`
		Status   UserStatus `json:"status"`
	}

	members := make([]memberInfo, 0, len(clients))
	for client := range clients {
		members = append(members, memberInfo{
			ID:       client.UserID,
			Username: client.UserID,
			Status:   client.Status,
		})
	}
	message := map[string]interface{}{
		"type":    "presenceUpdate",
		"members": members,
	}

	payload, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal presence update: %v", err)
		return
	}

	for client := range clients {
		select {
		case client.Send <- payload:
		default:
			log.Printf("Send buffer full for client %s, disconnecting", client.UserID)
			_ = pm.UnregisterClient(client)
			client.Conn.Close()
		}
	}
}

// broadcastToRoom broadcasts arbitrary messages to all clients in a room.
// Sends any byte message to every client in a given room (e.g., chat messages from readPump).
// Same send‑buffer full safety check as in broadcastPresence.
func (pm *PresenceManager) broadcastToRoom(roomID string, message []byte) {
	pm.mu.RLock()
	clients, exists := pm.rooms[roomID]
	pm.mu.RUnlock()
	if !exists {
		return
	}

	for client := range clients {
		select {
		case client.Send <- message:
		default:
			log.Printf("Send buffer full for client %s, disconnecting", client.UserID)
			_ = pm.UnregisterClient(client)
			client.Conn.Close()
		}
	}
}

// Lifecycle Example
// New user connects via /ws?roomId=abc&userId=u1.
// HandleWebSocket → NewClient → RegisterClient.
// PresenceManager tracks new client and calls broadcastPresence so everyone in room abc knows u1 joined.
// User sends chat → goes into broadcastToRoom → delivered to all in the room.
// User disconnects → UnregisterClient → room roster updated → broadcastPresence again.
