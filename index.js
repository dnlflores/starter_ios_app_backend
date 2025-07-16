import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { createServer } from 'http';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pushService from './push-service.js';
import websocketService from './websocket-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render's SSL connection
  },
});

const SECRET = process.env.SECRET || 'your_jwt_secret';

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).send({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send({ error: 'Invalid or expired token' });
  }
};

app.post('/signup', async (req, res) => {
  const { username, password, email, first_name, last_name, phone, address, city, state, zip } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (username, password, email, first_name, last_name, phone, address, city, state, zip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [username, hash, email, first_name, last_name, phone, address, city, state, zip]);
  res.status(201).send({ message: 'User created' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
  res.send({ token });
});

app.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, first_name, last_name, phone, address, city, state, zip FROM users');
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Device token registration endpoint
app.post('/device-token', authenticateToken, async (req, res) => {
  const { device_token, platform = 'ios' } = req.body;
  const userId = req.user.id;
  
  if (!device_token) {
    return res.status(400).send({ error: 'Device token is required' });
  }
  
  try {
    await pushService.registerDeviceToken(userId, device_token, platform);
    res.send({ message: 'Device token registered successfully' });
  } catch (err) {
    console.error('Error registering device token:', err);
    res.status(500).send({ error: 'Failed to register device token' });
  }
});

// Device token unregistration endpoint
app.delete('/device-token', authenticateToken, async (req, res) => {
  const { device_token } = req.body;
  const userId = req.user.id;
  
  if (!device_token) {
    return res.status(400).send({ error: 'Device token is required' });
  }
  
  try {
    await pushService.unregisterDeviceToken(userId, device_token);
    res.send({ message: 'Device token unregistered successfully' });
  } catch (err) {
    console.error('Error unregistering device token:', err);
    res.status(500).send({ error: 'Failed to unregister device token' });
  }
});

// Test notification endpoint (development only)
app.post('/test-notification', authenticateToken, async (req, res) => {
  const { title = 'Test Notification', body = 'This is a test notification' } = req.body;
  const userId = req.user.id;
  
  try {
    await pushService.sendNotificationToUser(userId, title, body, { type: 'test' });
    res.send({ message: 'Test notification sent successfully' });
  } catch (err) {
    console.error('Error sending test notification:', err);
    res.status(500).send({ error: 'Failed to send test notification' });
  }
});

// Image upload endpoint
app.post('/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Return the image URL that can be used in the frontend
    const imageUrl = `https://starter-ios-app-backend.onrender.com/uploads/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      fileName: req.file.filename 
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// List all tools
app.get('/tools', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tools.*, users.username AS owner_username, users.email AS owner_email, users.first_name AS owner_first_name, users.last_name AS owner_last_name, users.phone AS owner_phone, users.address AS owner_address, users.city AS owner_city, users.state AS owner_state, users.zip AS owner_zip
       FROM tools
       JOIN users ON tools.owner_id = users.id`
    );
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get a tool by name
app.get('/tools/name/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tools WHERE name = $1', [name]);
    if (!result.rows.length) {
      return res.status(404).send({ error: 'Tool not found' });
    }
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get a tool by id
app.get('/tools/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tools WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).send({ error: 'Tool not found' });
    }
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Create a new tool
app.post('/tools', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, price, description, owner_id, created_at, latitude, longitude } = req.body;
  let imageUrl = null;
  
  // If an image was uploaded, set the image URL
  if (req.file) {
    imageUrl = `https://starter-ios-app-backend.onrender.com/uploads/${req.file.filename}`;
  }
  console.log(`starting to create tool: ${name} ${price} ${description} ${owner_id} ${created_at} ${latitude} ${longitude}`)
  
  // Parse and format price to one decimal place
  const formattedPrice = price ? parseFloat(price).toFixed(1) : null;
  
  // Parse coordinates
  const lat = latitude ? parseFloat(latitude) : null;
  const lng = longitude ? parseFloat(longitude) : null;
  console.log(`parsed coordinates: ${lat} ${lng}`)
  
  try {
    const result = await pool.query(
      'INSERT INTO tools (name, price, description, owner_id, created_at, image_url, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, formattedPrice, description, owner_id, created_at, imageUrl, lat, lng]
    );
    res.status(201).send(result.rows[0]);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// Update an existing tool
app.put('/tools/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, price, description, owner_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tools SET name = $1, price = $2, description = $3, owner_id = $4 WHERE id = $5 RETURNING *',
      [name, price, description, owner_id, id]
    );
    if (!result.rows.length) {
      return res.status(404).send({ error: 'Tool not found' });
    }
    res.send(result.rows[0]);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// Delete a tool
app.delete('/tools/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tools WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).send({ error: 'Tool not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// List all chat messages with sender and recipient info
app.get('/chats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        s.username AS sender_username,
        s.first_name AS sender_first_name,
        s.last_name AS sender_last_name,
        r.username AS recipient_username,
        r.first_name AS recipient_first_name,
        r.last_name AS recipient_last_name,
        t.name AS tool_name,
        t.description AS tool_description
      FROM chats c
      JOIN users s ON c.sender_id = s.id
      JOIN users r ON c.recipient_id = r.id
      LEFT JOIN tools t ON c.tool_id = t.id
      ORDER BY c.created_at DESC
    `);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get a specific chat message by ID
app.get('/chats/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        s.username AS sender_username,
        s.first_name AS sender_first_name,
        s.last_name AS sender_last_name,
        r.username AS recipient_username,
        r.first_name AS recipient_first_name,
        r.last_name AS recipient_last_name,
        t.name AS tool_name,
        t.description AS tool_description
      FROM chats c
      JOIN users s ON c.sender_id = s.id
      JOIN users r ON c.recipient_id = r.id
      LEFT JOIN tools t ON c.tool_id = t.id
      WHERE c.id = $1
    `, [id]);
    
    if (!result.rows.length) {
      return res.status(404).send({ error: 'Chat message not found' });
    }
    
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get conversation between authenticated user and another user for a specific tool
app.get('/chats/conversation/:userId/:toolId', authenticateToken, async (req, res) => {
  const { userId, toolId } = req.params;
  const currentUserId = req.user.id;
  
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        s.username AS sender_username,
        s.first_name AS sender_first_name,
        s.last_name AS sender_last_name,
        r.username AS recipient_username,
        r.first_name AS recipient_first_name,
        r.last_name AS recipient_last_name,
        t.name AS tool_name,
        t.description AS tool_description
      FROM chats c
      JOIN users s ON c.sender_id = s.id
      JOIN users r ON c.recipient_id = r.id
      LEFT JOIN tools t ON c.tool_id = t.id
      WHERE ((c.sender_id = $1 AND c.recipient_id = $2) 
         OR (c.sender_id = $2 AND c.recipient_id = $1))
         AND c.tool_id = $3
      ORDER BY c.created_at ASC
    `, [currentUserId, userId, toolId]);
    
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get conversation between authenticated user and another user (legacy endpoint for backward compatibility)
app.get('/chats/conversation/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        s.username AS sender_username,
        s.first_name AS sender_first_name,
        s.last_name AS sender_last_name,
        r.username AS recipient_username,
        r.first_name AS recipient_first_name,
        r.last_name AS recipient_last_name,
        t.name AS tool_name,
        t.description AS tool_description
      FROM chats c
      JOIN users s ON c.sender_id = s.id
      JOIN users r ON c.recipient_id = r.id
      LEFT JOIN tools t ON c.tool_id = t.id
      WHERE (c.sender_id = $1 AND c.recipient_id = $2) 
         OR (c.sender_id = $2 AND c.recipient_id = $1)
      ORDER BY c.created_at ASC
    `, [currentUserId, userId]);
    
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get all conversations for the authenticated user
app.get('/chats/conversations', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        CASE 
          WHEN c.sender_id = $1 THEN c.recipient_id
          ELSE c.sender_id
        END AS other_user_id,
        CASE 
          WHEN c.sender_id = $1 THEN r.username
          ELSE s.username
        END AS other_user_username,
        CASE 
          WHEN c.sender_id = $1 THEN r.first_name
          ELSE s.first_name
        END AS other_user_first_name,
        CASE 
          WHEN c.sender_id = $1 THEN r.last_name
          ELSE s.last_name
        END AS other_user_last_name,
        c.tool_id,
        t.name AS tool_name,
        t.description AS tool_description,
        MAX(c.created_at) AS last_message_time
      FROM chats c
      JOIN users s ON c.sender_id = s.id
      JOIN users r ON c.recipient_id = r.id
      LEFT JOIN tools t ON c.tool_id = t.id
      WHERE c.sender_id = $1 OR c.recipient_id = $1
      GROUP BY other_user_id, other_user_username, other_user_first_name, other_user_last_name, c.tool_id, t.name, t.description
      ORDER BY last_message_time DESC
    `, [currentUserId]);
    
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Create a new chat message
app.post('/chats', authenticateToken, upload.single('image'), async (req, res) => {
  const { recipient_id, message, tool_id } = req.body;
  const sender_id = req.user.id;
  let imageUrl = null;
  
  // If an image was uploaded, set the image URL
  if (req.file) {
    imageUrl = `https://starter-ios-app-backend.onrender.com/uploads/${req.file.filename}`;
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO chats (sender_id, recipient_id, message, image_url, tool_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [sender_id, recipient_id, message, imageUrl, tool_id]
    );
    
    const newMessage = result.rows[0];
    
    // Broadcast the new message via WebSocket for real-time updates
    websocketService.broadcastNewMessage(newMessage);
    
    // Send push notification to recipient (async, don't wait for it)
    pushService.sendChatNotification(
      sender_id,
      recipient_id,
      message || 'Sent an image',
      newMessage.id
    ).catch(err => {
      console.error('Failed to send push notification:', err);
    });
    
    res.status(201).send(newMessage);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// Update a chat message
app.put('/chats/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { message, image_url } = req.body;
  const userId = req.user.id;
  
  try {
    // Check if the message exists and belongs to the authenticated user
    const checkResult = await pool.query('SELECT * FROM chats WHERE id = $1 AND sender_id = $2', [id, userId]);
    if (!checkResult.rows.length) {
      return res.status(404).send({ error: 'Chat message not found or you are not authorized to edit it' });
    }
    
    const result = await pool.query(
      'UPDATE chats SET message = $1, image_url = $2, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [message, image_url, id]
    );
    
    res.send(result.rows[0]);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// Delete a chat message
app.delete('/chats/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Check if the message exists and belongs to the authenticated user
    const result = await pool.query('DELETE FROM chats WHERE id = $1 AND sender_id = $2', [id, userId]);
    if (result.rowCount === 0) {
      return res.status(404).send({ error: 'Chat message not found or you are not authorized to delete it' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
websocketService.init(server);

// Add endpoint to check online status
app.get('/users/online', authenticateToken, async (req, res) => {
  try {
    const onlineUsers = websocketService.getOnlineUsers();
    res.send({ online_users: onlineUsers });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});
