// // Warp is a Rust web framework, focused on async HTTP and WebSocket APIs
// // A Filter picks apart HTTP requests and decides if/how to handle them.
// use warp::Filter;
// // These bring in convenient methods for working with async streams and sinks 
// // (like .next() and .send())—essential for handling messages over WebSockets.
// use futures_util::{StreamExt, SinkExt};
// use serde_json::json;
// use uuid::Uuid;
// use chrono::Utc;

// // async entry point of the app, powered by the tokio runtime—a requirement for async IO in Rust
// # [tokio::main]
// async fn main(){
//     let routes = warp::path("ws") // matches requests to path /ws.
//         .and(warp::ws()) // applies the WebSocket filter, ensuring the handshake happens only for WebSocket upgrade requests.
//         .map(|ws: warp::ws::Ws| ws.on_upgrade(handle_socket)); // for valid WS upgrades, runs the async function handle_socket, passing in the WebSocket connection.
//     println!("Running WebSocket server on 0.0.0.0:8080");
    
//     warp::serve(routes) // Starts serving requests that match the defined route/filter chain.
//         .run(([0, 0, 0, 0], 8080)) // Listens on all interfaces (0.0.0.0) at port 8080.
//         .await; // Waits for the server to run, keeping it alive.
// }
// async fn handle_socket(ws: warp::ws::WebSocket) { // Gets called for each new WebSocket connection.
//     let (mut tx, mut rx) = ws.split(); // divides the socket into a sender (tx) for outgoing messages, and receiver (rx) for incoming messages.
//     // the message loop
//     while let Some(Ok(msg)) = rx.next().await { // This awaits new messages from the client, exits loop if the socket closes.
//         if msg.is_text() {
//             let text = msg.to_str().unwrap_or("");
//             // constructing a proper JSON message for client
//             let resp = json!({
//                 "type": "chatMessage",
//                 "message": {
//                     "id": Uuid::new_v4().to_string(),
//                     "sender": {
//                         "id": 0,
//                         "username": "server"
//                     },
//                     "content": text,
//                     "timestamp": Utc::now().to_rfc3339()
//                 }
//             });
//             let resp_text = resp.to_string();
//             tx.send(warp::ws::Message::text(resp_text)).await.ok(); // If the client sent a text message, echo received text back to client, thus making it an 'Echo Server'
//         }
//     }
// }


// use warp::Filter;
// // use futures_util::{StreamExt, SinkExt};
// use std::collections::HashMap;
// use std::sync::{Arc, Mutex};
// use tokio::sync::mpsc::{unbounded_channel, UnboundedSender};
// use tokio_stream::wrappers::UnboundedReceiverStream;
// use serde_json::json;
// use warp::ws::{Message, WebSocket};
// // use futures_util::stream::StreamExt as _; // for rx.next()
// // use futures_util::sink::SinkExt as _; // for tx.send()
// use futures_util::{StreamExt, FutureExt};

// type UserId = String;
// type RoomId = String;
// type Tx = UnboundedSender<Result<Message, warp::Error>>;
// use dotenv::dotenv;

// // Shared state holding the mapping of room IDs to connection senders
// struct ServerState {
//     rooms: Mutex<HashMap<RoomId, Vec<Tx>>>,
// }

// // struct to represent the JWT claims you expect
// use serde::{Deserialize};
// #[derive(Debug, Deserialize)]
// struct Claims {
//     sub: String,
//     exp: usize,
// }

// use std::env;
// fn get_jwt_secret() -> String {
//     env::var("JWT_SECRET").unwrap_or_else(|_| "default-secret".to_string())
// }

// // decode and validate the JWT token
// use jsonwebtoken::{decode, DecodingKey, Validation, errors::ErrorKind};
// fn verify_token(token: &str, secret: &str) -> Result<String, String> {
//     match decode::<Claims>(
//         token,
//         &DecodingKey::from_secret(secret.as_ref()),
//         &Validation::default(),
//     ) {
//         Ok(token_data) => Ok(token_data.claims.sub),
//         Err(err) => {
//             eprintln!("JWT decode error: {:?}", err);
//             match *err.kind() {
//                 ErrorKind::InvalidToken => Err("Token is invalid".to_string()),
//                 ErrorKind::ExpiredSignature => Err("Token has expired".to_string()),
//                 _ => Err(format!("Other token validation error: {:?}", err)),
//             }
//         }
//     }
// }

// #[tokio::main]
// async fn main() {
//     dotenv().ok(); // loads .env vars into env::var()
//     // Create shared state for all connections and rooms
//     let state = Arc::new(ServerState {
//         rooms: Mutex::new(HashMap::new()),
//     });

//     // Define the WebSocket route at /ws accepting query parameters
//     let ws_route = warp::path("ws")
//         .and(warp::ws())
//         .and(warp::query::<HashMap<String, String>>())
//         .and(with_state(state.clone()))
//         .map(|ws: warp::ws::Ws, qs: HashMap<String, String>, state: Arc<ServerState>| {
//             ws.on_upgrade(move |socket| client_connected(socket, qs, state))
//         });

//     println!("Running WebSocket server on 0.0.0.0:8080");

//     // Serve the routes
//     warp::serve(ws_route).run(([0, 0, 0, 0], 8080)).await;
// }

// // Helper to inject state into filter chain
// fn with_state(state: Arc<ServerState>) -> impl Filter<Extract = (Arc<ServerState>,), Error = std::convert::Infallible> + Clone {
//     warp::any().map(move || state.clone())
// }

// // Handler called on successful websocket connection upgrade
// async fn client_connected(ws: WebSocket, qs: HashMap<String, String>, state: Arc<ServerState>) {
//     // Extract roomId from query parameters
//     let room_id = match qs.get("roomId") {
//         Some(r) => r.clone(),
//         None => {
//             // No roomId provided; close connection quietly
//             return;
//         }
//     };
//     // Extract token from query (dummy for now)
//     let token = match qs.get("token") {
//         Some(t) => t.clone(),
//         None => return, // no token, reject connection
//     };
//     let jwt_secret = get_jwt_secret();
//     eprintln!("Using JWT secret: {}", jwt_secret);
//     let user_id = match verify_token(&token, &jwt_secret) {
//         Ok(uid) => uid,
//         Err(e) => {
//             eprintln!("JWT verification failed: {}", e);
//             return;  // Close connection or reject auth
//         }
//     };
    
//     let (user_ws_tx, mut user_ws_rx) = ws.split(); // Split WebSocket into sender and receiver halves
//     let (tx, rx) = unbounded_channel(); // Create an unbounded channel for sending messages to this client
//     // Spawn a task that forwards messages from rx to the WebSocket's sender
//     tokio::task::spawn(
//         UnboundedReceiverStream::new(rx).forward(user_ws_tx).map(|result| {
//             if let Err(e) = result {
//                 eprintln!("WebSocket send error: {}", e);
//             }
//         })
//     );
//     // Register this user's connection into the room's client list
//     {
//         let mut rooms = state.rooms.lock().unwrap();
//         rooms.entry(room_id.clone()).or_default().push(tx.clone());
//     }

//     // Broadcast presence update that this user joined
//     broadcast_to_room(&state, &room_id, json!({
//         "type": "presenceUpdate",
//         "message": format!("User {} joined the room", user_id)
//     })).await;

//     // Process incoming messages from this user
//     while let Some(result) = user_ws_rx.next().await {
//         match result {
//             Ok(msg) if msg.is_text() => {
//                 let msg_text = msg.to_str().unwrap_or("");
//                 // Build the broadcast message JSON
//                 let broadcast_msg = json!({
//                     "type": "chatMessage",
//                     "message": {
//                         "id": uuid::Uuid::new_v4().to_string(),
//                         "sender": {
//                             "id": user_id,
//                             "username": user_id, // Replace with real username after auth
//                         },
//                         "content": msg_text,
//                         "timestamp": chrono::Utc::now().to_rfc3339(),
//                     }
//                 });
//                 // Broadcast message to all clients in the room
//                 broadcast_to_room(&state, &room_id, broadcast_msg).await;
//             },
//             Ok(_) => {
//                 // Ignore non-text messages like ping/pong/binary
//             },
//             Err(e) => {
//                 eprintln!("WebSocket error: {}", e);
//                 break;
//             }
//         }
//     }

//     // Connection closed: unregister this client from room
//     {
//         let mut rooms = state.rooms.lock().unwrap();
//         if let Some(clients) = rooms.get_mut(&room_id) {
//             clients.retain(|client_tx| !client_tx.same_channel(&tx));
//         }
//     }

//     // Broadcast presence update that this user left
//     broadcast_to_room(&state, &room_id, json!({
//         "type": "presenceUpdate",
//         "message": format!("User {} left the room", user_id)
//     })).await;
// }

// // Utility to broadcast a JSON message to all clients connected to a room
// async fn broadcast_to_room(state: &Arc<ServerState>, room_id: &str, message: serde_json::Value) {
//     let rooms = state.rooms.lock().unwrap();
//     if let Some(clients) = rooms.get(room_id) {
//         let msg_string = serde_json::to_string(&message).unwrap_or_else(|_| "{}".into());
//         for client_tx in clients {
//             let _ = client_tx.send(Ok(Message::text(msg_string.clone())));
//         }
//     }
// }


use warp::Filter;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::{unbounded_channel, UnboundedSender};
use tokio_stream::wrappers::UnboundedReceiverStream;
use serde_json::json;
use warp::ws::{Message, WebSocket};
use futures_util::{StreamExt, FutureExt};

type UserId = String;
type RoomId = String;
type Tx = UnboundedSender<Result<Message, warp::Error>>;

struct ServerState {
    rooms: Mutex<HashMap<RoomId, Vec<Tx>>>,
}

#[tokio::main]
async fn main() {
    // Create shared state for all connections and rooms
    let state = Arc::new(ServerState {
        rooms: Mutex::new(HashMap::new()),
    });

    // WebSocket route at /ws accepting query parameters
    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(warp::query::<HashMap<String, String>>())
        .and(with_state(state.clone()))
        .map(|ws: warp::ws::Ws, qs: HashMap<String, String>, state: Arc<ServerState>| {
            ws.on_upgrade(move |socket| client_connected(socket, qs, state))
        });

    println!("Running WebSocket server on 0.0.0.0:8080");

    warp::serve(ws_route).run(([0, 0, 0, 0], 8080)).await;
}

// Inject shared state into filter chain
fn with_state(state: Arc<ServerState>) -> impl Filter<Extract = (Arc<ServerState>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || state.clone())
}

async fn client_connected(ws: WebSocket, qs: HashMap<String, String>, state: Arc<ServerState>) {
    eprintln!("New WS connection with query params: {:?}", qs);

    // Extract roomId from query parameters or default
    let room_id = match qs.get("roomId") {
        Some(r) => r.clone(),
        None => {
            eprintln!("No roomId provided, closing connection.");
            return;
        }
    };

    // *** Token validation removed ***
    // Assign dummy user id
    let user_id = format!("user-{}", uuid::Uuid::new_v4());

    eprintln!("Assigned user_id: {}", user_id);

    let (user_ws_tx, mut user_ws_rx) = ws.split();

    let (tx, rx) = unbounded_channel();

    // Task to forward messages from channel to websocket sender
    tokio::task::spawn(
        UnboundedReceiverStream::new(rx)
            .forward(user_ws_tx)
            .map(|result| {
                if let Err(e) = result {
                    eprintln!("WebSocket send error: {}", e);
                }
            }),
    );

    // Register client sender in room
    {
        let mut rooms = state.rooms.lock().unwrap();
        rooms.entry(room_id.clone()).or_default().push(tx.clone());
    }

    // Broadcast presence update that user joined
    broadcast_to_room(&state, &room_id, json!({
        "type": "presenceUpdate",
        "message": format!("User {} joined the room", user_id)
    })).await;

    // Process incoming messages from this user
    while let Some(result) = user_ws_rx.next().await {
        match result {
            Ok(msg) if msg.is_text() => {
                let msg_text = msg.to_str().unwrap_or("");
                let broadcast_msg = json!({
                    "type": "chatMessage",
                    "message": {
                        "id": uuid::Uuid::new_v4().to_string(),
                        "sender": {
                            "id": user_id,
                            "username": user_id,
                        },
                        "content": msg_text,
                        "timestamp": chrono::Utc::now().to_rfc3339(),
                    }
                });
                broadcast_to_room(&state, &room_id, broadcast_msg).await;
            },
            Ok(_) => {
                // ignore binary/ping/pong
            },
            Err(e) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
        }
    }

    // Unregister client on disconnect
    {
        let mut rooms = state.rooms.lock().unwrap();
        if let Some(clients) = rooms.get_mut(&room_id) {
            clients.retain(|client_tx| !client_tx.same_channel(&tx));
        }
    }

    // Broadcast presence update that user left
    broadcast_to_room(&state, &room_id, json!({
        "type": "presenceUpdate",
        "message": format!("User {} left the room", user_id)
    })).await;
}

async fn broadcast_to_room(state: &Arc<ServerState>, room_id: &str, message: serde_json::Value) {
    let rooms = state.rooms.lock().unwrap();
    if let Some(clients) = rooms.get(room_id) {
        let msg_string = serde_json::to_string(&message).unwrap_or_else(|_| "{}".to_string());
        for client_tx in clients {
            let _ = client_tx.send(Ok(Message::text(msg_string.clone())));
        }
    }
}
