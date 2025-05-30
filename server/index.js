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

app.listen(3000, () => console.log('Server running on port 3000'));
