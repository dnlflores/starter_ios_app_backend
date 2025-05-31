const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgres://iosuser:secret@localhost:5432/iosdb'
});

const SECRET = 'your_jwt_secret';

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
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

app.get('/users', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  try {
    jwt.verify(token, SECRET);
    const result = await pool.query('SELECT id, username FROM users');
    res.send(result.rows);
  } catch {
    res.status(401).send({ error: 'Unauthorized' });
  }
});

// List all tools
app.get('/tools', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tools');
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
app.post('/tools', async (req, res) => {
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
app.put('/tools/:id', async (req, res) => {
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
app.delete('/tools/:id', async (req, res) => {
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

app.listen(3000, () => console.log('Server running on port 3000'));
