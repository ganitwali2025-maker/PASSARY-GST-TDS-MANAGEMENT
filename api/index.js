/**
 * Passary Refractories — GST & TDS Management
 * Backend server
 *
 * Serves the frontend (public/) and exposes a small REST API that the
 * frontend uses to persist its data, backed by a JSON file on disk
 * (data/store.json). Swap out the readStore/writeStore functions for a
 * real database (Postgres, MongoDB, etc.) later without touching the
 * frontend — the API contract stays the same.
 */
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const app = express();
app.use(express.json({ limit: '5mb' }));

/* ---------------- storage helpers ---------------- */
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify({}), 'utf8');
}
function readStore() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}
function writeStore(store) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}
function storeKey(key, shared) {
  return (shared ? 'shared:' : 'personal:') + key;
}

/* ---------------- API ---------------- */

// GET /api/storage?prefix=&shared=true|false  -> list keys
app.get('/api/storage', (req, res) => {
  const shared = req.query.shared === 'true';
  const prefix = req.query.prefix || '';
  const store = readStore();
  const wantPrefix = (shared ? 'shared:' : 'personal:') + prefix;
  const keys = Object.keys(store)
    .filter((k) => k.startsWith(wantPrefix))
    .map((k) => k.slice(shared ? 7 : 9));
  res.json({ keys, prefix: prefix || undefined, shared });
});

// GET /api/storage/:key?shared=true|false
app.get('/api/storage/:key', (req, res) => {
  const shared = req.query.shared === 'true';
  const store = readStore();
  const sk = storeKey(req.params.key, shared);
  if (!(sk in store)) return res.status(404).json({ error: 'not found' });
  res.json({ key: req.params.key, value: store[sk], shared });
});

// POST /api/storage/:key  body: { value, shared }
app.post('/api/storage/:key', (req, res) => {
  const { value, shared } = req.body || {};
  if (typeof value !== 'string') return res.status(400).json({ error: 'value must be a string' });
  const store = readStore();
  const sk = storeKey(req.params.key, !!shared);
  store[sk] = value;
  writeStore(store);
  res.json({ key: req.params.key, value, shared: !!shared });
});

// DELETE /api/storage/:key?shared=true|false
app.delete('/api/storage/:key', (req, res) => {
  const shared = req.query.shared === 'true';
  const store = readStore();
  const sk = storeKey(req.params.key, shared);
  const existed = sk in store;
  delete store[sk];
  writeStore(store);
  res.json({ key: req.params.key, deleted: existed, shared });
});

/* ---------------- static frontend ---------------- */
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    ensureStore();
    console.log(`Passary Refractories TaxSuite running at http://localhost:${PORT}`);
  });
}

module.exports = app;
