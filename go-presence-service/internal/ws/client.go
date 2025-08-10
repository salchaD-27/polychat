// classic WebSocket client handler in Go.
// readPump continuously reads incoming messages, handles pong responses, and broadcasts messages to a shared room.
// writePump waits for messages to send or periodic pings, batching messages, and writes to the WebSocket.
// The presence manager (not shown here) manages client registration, broadcasting, and unregistering.
// The connection uses timeouts and ping/pong heartbeats to detect and clean up disconnected clients.
// The buffered Send channel decouples client message sending from WebSocket write IO.
// This design supports scalable, real-time messaging like chat rooms or presence-aware apps.

// The PresenceManager is a central component that manages all connected clients and rooms. Its responsibilities typically include:
// Registering clients when they connect.
// Unregistering clients when they disconnect.
// Maintaining a mapping between clients and rooms.
// Broadcasting messages to all clients within a particular room.
// Managing user presence status (online/offline) per room.

// Key likely components and their roles:
// A map or dictionary of rooms to sets of clients.
// Methods such as:
// RegisterClient(client *Client) — adds a client to a room.
// UnregisterClient(client *Client) — removes a client from a room.
// broadcastToRoom(roomID string, message []byte) — sends a message to all clients connected in a room.

// Client Lifecycle with PresenceManager
// Client Connects:
// A new WebSocket connection is accepted by the server.
// NewClient is called, creating a new Client struct with connection, room, user info, and a reference to the PresenceManager.
// The client is registered with the PresenceManager, which adds it to the room's client list.

// Start Pumps:
// The server typically starts two go routines for each client:
// readPump(): reads incoming messages from the WebSocket.
// writePump(): writes messages (and ping messages) to the WebSocket.
// These run concurrently and manage the ongoing client connection.

// Message Handling:
// ReadPump receives messages from the client's WebSocket connection.
// After sanitizing, messages are passed to the PresenceManager via broadcastToRoom.
// PresenceManager sends the message to the Send channels of all clients in that room (including this client, if desired).

// Sending Messages to Clients:
// WritePump listens on the Send channel for outbound messages.
// Upon receiving messages, it writes them to the WebSocket connection.
// The writePump also periodically sends ping messages for connection health checking.
// If the Send channel closes (meaning the client is unregistered or disconnected), writePump gracefully terminates the connection.

// Client Disconnects:
// If a read or write error occurs (closed connection, network error, unexpected close), the pumps exit.
// The client unregisters itself from the PresenceManager.
// The WebSocket connection is closed.
// The client's presence is removed from the room.
package ws

import (
	"bytes"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
)

// Client represents a WebSocket client connection.
type Client struct {
	UserID string
	RoomID string
	Conn   *websocket.Conn
	Send   chan []byte

	manager *PresenceManager
	Status  UserStatus
}

// Creates a new client instance with the given WebSocket connection, room ID, user ID, and manager.
func NewClient(conn *websocket.Conn, manager *PresenceManager, roomID, userID string) *Client {
	return &Client{
		Conn:    conn,
		Send:    make(chan []byte, 256), // The Send channel has a buffer of 256 to queue outgoing messages.
		manager: manager,
		RoomID:  roomID,
		UserID:  userID,
		Status:  StatusOnline,
	}
}

func (c *Client) readPump() {
	defer func() {
		c.manager.UnregisterClient(c)
		c.Conn.Close()
	}()

	// Sets a max message size and a read deadline for pong timeouts.
	c.Conn.SetReadLimit(maxMessageSize)
	_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	// Defines a Pong handler to extend the deadline on pong receipt (keeps connection alive)
	c.Conn.SetPongHandler(func(string) error {
		_ = c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for { // Continuously reads messages.
		_, message, err := c.Conn.ReadMessage()
		if err != nil { // On error or connection close, unregisters client and closes connection.
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unexpected close error: %v", err)
			}
			break
		}
		// Incoming messages are sanitized and broadcasted to the room via PresenceManager.
		message = bytes.TrimSpace(bytes.Replace(message, []byte{'\n'}, []byte{' '}, -1))
		c.manager.broadcastToRoom(c.RoomID, message)
	}
}

func (c *Client) writePump() {
	// Uses a ticker to send periodic ping messages at pingPeriod.
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()
	// Listens to the Send channel for outgoing messages.
	for {
		select {
		case message, ok := <-c.Send:
			// Sets write deadlines to avoid blocking.
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Channel closed by manager
				// If Send channel is closed, sends WebSocket close message and closes connection.
				_ = c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			// Sends the current message plus any queued messages (batched) in one websocket write.
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, err = w.Write(message)
			if err != nil {
				return
			}

			// Send queued messages as well
			n := len(c.Send)
			for i := 0; i < n; i++ {
				_, err = w.Write([]byte{'\n'})
				if err != nil {
					return
				}
				_, err = w.Write(<-c.Send)
				if err != nil {
					return
				}
			}

			if err := w.Close(); err != nil {
				return
			}

		// On ticker event, sends ping to the client to keep connection alive and detect disconnected clients.
		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
