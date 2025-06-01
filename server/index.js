const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SECRET = 'your_jwt_secret';

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from('users').insert({ username, password: hash });
  if (error) {
    return res.status(400).send({ error: error.message });
  }
  res.status(201).send({ message: 'User created' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error || !user || !(await bcrypt.compare(password, user.password))) {
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
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, first_name, last_name, phone, address, city, state, zip');
    if (error) {
      throw error;
    }
    res.send(data);
  } catch {
    res.status(401).send({ error: 'Unauthorized' });
  }
});

// List all tools
app.get('/tools', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*, owner:users(id, username, email, first_name, last_name, phone, address, city, state, zip)');
    if (error) throw error;
    const tools = data.map(t => ({
      id: t.id,
      name: t.name,
      price: t.price,
      description: t.description,
      owner_id: t.owner_id,
      owner_username: t.owner?.username,
      owner_email: t.owner?.email,
      owner_first_name: t.owner?.first_name,
      owner_last_name: t.owner?.last_name,
      owner_phone: t.owner?.phone,
      owner_address: t.owner?.address,
      owner_city: t.owner?.city,
      owner_state: t.owner?.state,
      owner_zip: t.owner?.zip,
    }));
    res.send(tools);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get a tool by name
app.get('/tools/name/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('name', name)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).send({ error: 'Tool not found' });
    }
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get a tool by id
app.get('/tools/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).send({ error: 'Tool not found' });
    }
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Create a new tool
app.post('/tools', async (req, res) => {
  const { name, price, description, owner_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('tools')
      .insert({ name, price, description, owner_id })
      .select()
      .maybeSingle();
    if (error) throw error;
    res.status(201).send(data);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// Update an existing tool
app.put('/tools/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, description, owner_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('tools')
      .update({ name, price, description, owner_id })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).send({ error: 'Tool not found' });
    }
    res.send(data);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// Delete a tool
app.delete('/tools/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error, count } = await supabase
      .from('tools')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (error) throw error;
    if (count === 0) {
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
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('created_at');
    if (error) throw error;
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Create a new chat message
app.post('/chats', async (req, res) => {
  const { user_id, message } = req.body;
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id, message })
      .select()
      .maybeSingle();
    if (error) throw error;
    res.status(201).send(data);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
