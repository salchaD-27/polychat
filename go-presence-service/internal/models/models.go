// internal/models/models.go
package models

import "time"

// User represents a user currently connected or present in a chat room.
type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Status   string `json:"status"` // e.g. "online", "away", "offline"
}

// ChatMessage represents the structure of a chat message sent/received over WebSocket.
type ChatMessage struct {
	ID        string    `json:"id"`
	Sender    User      `json:"sender"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// WebSocketMessage is a generic struct wrapping different message types.
// Type field distinguishes message types like "chatMessage", "presenceUpdate" etc.
type WebSocketMessage struct {
	Type    string      `json:"type"`              // e.g. "chatMessage", "presenceUpdate"
	Message interface{} `json:"message,omitempty"` // For chatMessage or similar
	Members []User      `json:"members,omitempty"` // For presenceUpdate
}
