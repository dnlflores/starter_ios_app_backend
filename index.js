import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const app = express();
app.use(cors());
app.use(express.json());

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

// List all tools
app.get('/tools', authenticateToken, async (req, res) => {
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
app.post('/tools', authenticateToken, async (req, res) => {
  const { name, price, description, owner_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tools (name, price, description, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, description, owner_id]
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

// List all chat messages
app.get('/chats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chats ORDER BY created_at');
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Create a new chat message
app.post('/chats', async (req, res) => {
  const { user_id, message } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO chats (user_id, message) VALUES ($1, $2) RETURNING *',
      [user_id, message]
    );
    res.status(201).send(result.rows[0]);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
