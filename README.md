# Passary Refractories — GST & TDS Management

Enterprise GST & TDS working register for the six Passary Refractories group
companies. Runs as a normal Node.js web app with its own backend, and can be
**installed** on desktop or mobile like a native app (PWA).

## Folder structure

```
Passary GST & TDS/
├── package.json        → dependencies + start script
├── vercel.json          → Vercel deployment configuration
├── api/
│   └── index.js         → Express backend (serves the app + storage API)
├── data/
│   └── store.json       → all your saved data lives here (for local dev)
├── public/
│   ├── index.html       → the entire frontend app (UI + logic)
│   ├── manifest.json    → makes the app installable (PWA)
│   ├── sw.js            → service worker (offline app shell caching)
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── README.md
```

## 1. Requirements

- [Node.js](https://nodejs.org) version 18 or newer (includes `npm`).

Check you have it:

```bash
node -v
npm -v
```

## 2. Install

Open a terminal in this folder and run:

```bash
npm install
```

This downloads the one dependency (`express`) into a `node_modules` folder.

## 3. Run

```bash
npm start
```

You'll see:

```
Passary Refractories TaxSuite running at http://localhost:3000
```

Open that address in your browser (Chrome/Edge recommended).

## 4. Install it as an app (PWA)

Once it's running in Chrome or Edge:

- **Desktop:** click the install icon (⊕ / monitor icon) in the address bar,
  or open the browser menu → "Install Passary TaxSuite…"
- **Android (Chrome):** browser menu → "Add to Home screen" / "Install app".
- **iPhone (Safari):** tap Share → "Add to Home Screen".

It will then open in its own window/icon, without browser tabs — just like a
regular desktop or mobile app.

> The app must be reachable at a URL (even `localhost`) for install and the
> service worker to work — opening `index.html` directly as a file (`file://`)
> will not work correctly, since it needs the backend API.

## 5. Where your data is stored

Everything you enter (companies, GST/TDS entries, remarks, users, settings)
is saved by the backend into `data/store.json` on the machine running the
server. Back up that file (or the whole `data/` folder) to keep your records
safe — deleting it resets the app to the default six companies.

## 6. Running it permanently / on a server

For real day-to-day use (so it's always available, not just when your laptop
is on), deploy this folder to any Node-capable host (a small VPS, Render,
Railway, an office server, etc.) and run `npm install && npm start` there —
or use a process manager so it restarts automatically:

```bash
npm install -g pm2
pm2 start api/index.js --name passary-taxsuite
pm2 save
```

By default it listens on port `3000`. To use a different port:

```bash
PORT=8080 npm start
```

## 7. Upgrading the storage backend later

`server.js` keeps all data in a single JSON file for simplicity, behind a
small REST API (`GET/POST/DELETE /api/storage/:key`). If you outgrow that
(more users, more data), swap the `readStore`/`writeStore` functions in
`server.js` for calls to a real database — the frontend doesn't need to
change, since it only talks to that same API.

## 8. Multi-user note

This version has no login/authentication — anyone who can reach the server's
address can open and edit the data. It's meant for a trusted internal team
or a single machine. If you need per-user logins and access control, that's
a further backend addition (ask and it can be added).
