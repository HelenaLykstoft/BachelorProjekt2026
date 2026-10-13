# FiveM Skin Studio

A web app that makes skinning FiveM clothing faster. Upload a clothing template, add color, texture and a logo, and export the result as a PNG.

Video link: 

https://github.com/user-attachments/assets/e3abfbc3-895c-4c9d-8c4a-0f74c3f86162

Bachelor project, 2026.

## Features

- Upload clothing templates (PNG) and keep them in a library
- Tint the clothing with any color and adjust intensity, fade and texture
- Place a logo, then drag and resize it freely
- Save skins and come back to them later
- Export the finished skin as a PNG in the size you need

## Run it locally

**You need:** [Node.js](https://nodejs.org) version 22.13 or newer. Check with `node -v`.

```bash
git clone https://github.com/HelenaLykstoft/BachelorProjekt2026.git
cd BachelorProjekt2026
npm install
npm start
```

Open **http://localhost:8000** in your browser.

To stop the server, press `Ctrl + C` in the terminal.

## Good to know

- Everything is stored locally. Templates and logos go in `uploads/`, saved skins in `data/app.db`. Both are created automatically on first start.
- Only PNG files are accepted, up to 10 MB.
- Port 8000 already in use? Close the other program using it, or change `PORT` in `server.js`.

## Tech

Node.js, Express and plain JavaScript, HTML and CSS. No frontend framework and no build step. Data is stored with Node's built-in SQLite.
