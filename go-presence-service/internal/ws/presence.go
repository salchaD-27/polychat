// /internal/ws/presence.go
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
	mu    sync.RWMutex
	rooms map[string]map[*Client]struct{}
}

func NewPresenceManager() *PresenceManager {
	return &PresenceManager{
		rooms: make(map[string]map[*Client]struct{}),
	}
}

func (pm *PresenceManager) RegisterClient(client *Client) error {
	if client == nil {
		return nil
	}

	pm.mu.Lock()
	defer pm.mu.Unlock()

	if _, exists := pm.rooms[client.RoomID]; !exists {
		pm.rooms[client.RoomID] = make(map[*Client]struct{})
	}

	pm.rooms[client.RoomID][client] = struct{}{}
	client.Status = StatusOnline

	log.Printf("Client userID=%s joined room=%s", client.UserID, client.RoomID)

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

	delete(clients, client)
	log.Printf("Client userID=%s left room=%s", client.UserID, client.RoomID)

	if len(clients) == 0 {
		delete(pm.rooms, client.RoomID)
	}

	go pm.broadcastPresence(client.RoomID)
	return nil
}

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
