# WebSocket manager for real-time communication
from fastapi import WebSocket
from typing import Dict, List, Set
import json
import asyncio

class WebSocketManager:
    def __init__(self):
        # Map challenge_id to set of WebSocket connections
        self.challenge_connections: Dict[str, Set[WebSocket]] = {}
        # Map WebSocket to challenge_id for cleanup
        self.connection_challenges: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, challenge_id: str):
        """Connect a WebSocket to a challenge."""
        await websocket.accept()
        
        if challenge_id not in self.challenge_connections:
            self.challenge_connections[challenge_id] = set()
        
        self.challenge_connections[challenge_id].add(websocket)
        self.connection_challenges[websocket] = challenge_id

    def disconnect(self, websocket: WebSocket, challenge_id: str):
        """Disconnect a WebSocket from a challenge."""
        if challenge_id in self.challenge_connections:
            self.challenge_connections[challenge_id].discard(websocket)
            
            # Clean up empty challenge
            if not self.challenge_connections[challenge_id]:
                del self.challenge_connections[challenge_id]
        
        # Remove from connection mapping
        if websocket in self.connection_challenges:
            del self.connection_challenges[websocket]

    async def broadcast_to_challenge(self, challenge_id: str, message: dict):
        """Broadcast a message to all connections in a challenge."""
        if challenge_id not in self.challenge_connections:
            return
        
        # Get connections to remove (closed connections)
        connections_to_remove = set()
        
        for websocket in self.challenge_connections[challenge_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending message to WebSocket: {e}")
                connections_to_remove.add(websocket)
        
        # Remove closed connections
        for websocket in connections_to_remove:
            self.disconnect(websocket, challenge_id)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific user across all their connections."""
        # This would require tracking user connections
        # For now, just broadcast to all challenges
        for challenge_id in self.challenge_connections:
            await self.broadcast_to_challenge(challenge_id, message)

    def get_connection_count(self, challenge_id: str) -> int:
        """Get the number of active connections for a challenge."""
        return len(self.challenge_connections.get(challenge_id, set()))

    def get_total_connections(self) -> int:
        """Get the total number of active connections."""
        return sum(len(connections) for connections in self.challenge_connections.values())
