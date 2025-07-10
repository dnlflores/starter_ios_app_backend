import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // Map of userId -> WebSocket connection
        this.SECRET = process.env.SECRET || 'your_jwt_secret';
    }

    init(server) {
        this.wss = new WebSocketServer({ 
            server,
            path: '/ws'
        });

        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection');
            
            // Handle authentication
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    
                    if (data.type === 'auth') {
                        this.handleAuthentication(ws, data.token);
                    } else if (data.type === 'ping') {
                        // Handle ping/pong for connection health
                        ws.send(JSON.stringify({ type: 'pong' }));
                    }
                } catch (error) {
                    console.error('WebSocket message parsing error:', error);
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Invalid message format' 
                    }));
                }
            });

            ws.on('close', () => {
                // Remove client from active connections
                for (const [userId, client] of this.clients) {
                    if (client === ws) {
                        this.clients.delete(userId);
                        console.log(`User ${userId} disconnected`);
                        break;
                    }
                }
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        console.log('WebSocket server initialized');
    }

    handleAuthentication(ws, token) {
        try {
            const decoded = jwt.verify(token, this.SECRET);
            const userId = decoded.id;
            
            // Store the authenticated connection
            this.clients.set(userId, ws);
            
            ws.send(JSON.stringify({ 
                type: 'auth_success', 
                userId: userId 
            }));
            
            console.log(`User ${userId} authenticated via WebSocket`);
        } catch (error) {
            console.error('WebSocket authentication error:', error);
            ws.send(JSON.stringify({ 
                type: 'auth_error', 
                message: 'Invalid token' 
            }));
            ws.close();
        }
    }

    // Send a message to a specific user
    sendToUser(userId, message) {
        const client = this.clients.get(userId);
        if (client && client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    // Send a message to multiple users
    sendToUsers(userIds, message) {
        let sentCount = 0;
        userIds.forEach(userId => {
            if (this.sendToUser(userId, message)) {
                sentCount++;
            }
        });
        return sentCount;
    }

    // Broadcast a new message to relevant users
    broadcastNewMessage(messageData) {
        const { sender_id, recipient_id } = messageData;
        
        // Send to both sender and recipient
        const message = {
            type: 'new_message',
            data: messageData
        };
        
        this.sendToUser(sender_id, message);
        this.sendToUser(recipient_id, message);
    }

    // Get list of online users
    getOnlineUsers() {
        return Array.from(this.clients.keys());
    }

    // Check if a user is online
    isUserOnline(userId) {
        return this.clients.has(userId);
    }
}

export default new WebSocketService();
