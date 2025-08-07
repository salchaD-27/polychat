# PolyChat
PolyChat is a sophisticated real-time chat platform designed for high performance, scalability, and seamless user experience. It leverages modern technologies including Rust, Go, React, Redux, and PostgreSQL to deliver a secure, concurrent, and real-time communication system.

## Features
- **Rust-based WebSocket Server**  
  Handles live chat connections with maximum performance and concurrency, efficiently managing multiple chat rooms and user communication.
- **Go Microservice for User Presence**  
  Manages real-time user presence tracking, pub/sub messaging, and coordination between distributed Rust nodes, ensuring accurate online status across the platform.
- **React + Redux Frontend**  
  Provides a dynamic and responsive user interface for chatting, room management, and viewing user presence with online indicators.
- **PostgreSQL Database**  
  Persists chat metadata including messages, users, and room information securely and reliably.

## Architecture Overview
- The **WebSocket server** in Rust handles real-time bi-directional communication, broadcasting messages to users within chat rooms.
- The **presence microservice** in Go tracks user status, broadcasts presence updates, and manages distributed coordination.
- The **frontend** is a React application powered by Redux for state management, connecting via WebSocket for live updates and REST API for historical data fetching.
- **PostgreSQL** serves as the backing store, preserving chat and user metadata.

## Getting Started

### Prerequisites

- Rust 1.70+ for backend server
- Go 1.20+ for presence microservice
- Node.js 18+ for frontend
- PostgreSQL 12+ database server
- Docker and Kubernetes (optional for containerization and deployment)

### Setup

1. **Database**

   - Install PostgreSQL and create the required database.
   - Run schema migrations to setup tables for users, chatrooms, messages, and presence.

2. **Backend**

   - Build and run the Rust-based WebSocket server.
   - Configure environment variables including JWT secrets and database connection details.

3. **Presence Service**

   - Build and run the Go presence microservice.
   - Ensure it can connect to the WebSocket and coordinate with backend nodes.

4. **Frontend**

   - Install dependencies with `npm install` or `yarn`.
   - Run the React app with `npm run dev` or `yarn dev`.
   - Connect to backend and presence WebSocket endpoints.

### Environment Configuration

- Use `.env` files or environment variables to securely store secrets such as JWT secret keys, database URLs, and service endpoints.

## Usage

- Users authenticate and join chat rooms.
- Real-time messages are exchanged through the Rust WebSocket server.
- Online presence and user status updates are managed via the Go presence service.
- Chat history and metadata are fetched from the PostgreSQL database and REST APIs.
- The React frontend provides an intuitive UI to chat and monitor room members and their presence status.