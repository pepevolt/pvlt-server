const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage
const users = new Map();

const MAX_ENERGY = 10000;
const INITIAL_ENERGY = 50;
const ENERGY_REGEN_INTERVAL = 3;
const POINTS_TO_GPVLT_RATE = 100;

function getUserData(wallet) {
  if (!users.has(wallet)) {
    users.set(wallet, {
      points: 0,
      energy: INITIAL_ENERGY,
      gpvlt: 0,
      lastRegen: Date.now(),
      lastTap: 0
    });
  }
  return users.get(wallet);
}

function updateEnergy(user) {
  const now = Date.now();
  const timePassed = Math.floor((now - user.lastRegen) / 1000);
  const energyGain = Math.floor(timePassed / ENERGY_REGEN_INTERVAL);
  
  if (energyGain > 0) {
    user.energy = Math.min(user.energy + energyGain, MAX_ENERGY);
    user.lastRegen = now;
  }
  return user.energy;
}

function autoConvertPoints(user) {
  let converted = 0;
  while (user.points >= POINTS_TO_GPVLT_RATE) {
    user.points -= POINTS_TO_GPVLT_RATE;
    user.gpvlt += 1;
    converted++;
  }
  return converted;
}

app.get('/', (req, res) => {
  res.json({ message: 'PepeVolt API Running!', status: 'online' });
});

app.post('/user', (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: 'Wallet required' });
    
    const user = getUserData(wallet);
    updateEnergy(user);
    
    res.json({
      points: user.points,
      energy: user.energy,
      gpvlt: user.gpvlt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/tap', (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: 'Wallet required' });
    
    const user = getUserData(wallet);
    updateEnergy(user);
    
    const now = Date.now();
    if (now - user.lastTap < 100) {
      return res.status(429).json({ error: 'Tap too fast!' });
    }
    user.lastTap = now;
    
    if (user.energy <= 0) {
      return res.status(400).json({ error: 'Not enough energy!' });
    }
    
    user.energy--;
    user.points++;
    const converted = autoConvertPoints(user);
    
    res.json({
      points: user.points,
      energy: user.energy,
      gpvlt: user.gpvlt,
      converted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/refill', (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: 'Wallet required' });
    
    const user = getUserData(wallet);
    user.energy = Math.min(user.energy + 10000, MAX_ENERGY);
    user.lastRegen = Date.now();
    
    res.json({ energy: user.energy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', users: users.size });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});